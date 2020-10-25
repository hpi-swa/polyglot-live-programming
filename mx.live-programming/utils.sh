#!/usr/bin/env bash
#
# Copyright (c) 2020, Software Architecture Group, Hasso Plattner Institute.
#
# Licensed under the MIT License.
#

set -o errexit
set -o errtrace
set -o pipefail
set -o nounset

readonly SCRIPT_DIRECTORY="$(cd "$(dirname "${BASH_SOURCE[0]}")/" && pwd)"
readonly BASE_DIRECTORY="$(dirname "${SCRIPT_DIRECTORY}")"

# Load metadata from suite.py
readonly py_export=$(cat <<-END
from suite import suite;
vars= ' '.join(['DEP_%s=%s' % (k.upper(), v)
  for k, v in suite['live-programming:dependencyMap'].items()]);
slug = '/'.join(suite['url'].split('/')[-2:]);
graal = next(s for s in suite['imports']['suites'] if s['name'] == 'tools')
graal_version = graal['version']
graal_url = graal['urls'][0]['url']
print('export %s GITHUB_SLUG=%s GRAAL_VERSION=%s GRAAL_URL=%s' % (vars, slug, graal_version, graal_url))
END
)
$(cd "${SCRIPT_DIRECTORY}" && python -c "${py_export}")
([[ -z "${DEP_JVMCI}" ]] || [[ -z "${GITHUB_SLUG}" ]]) && \
  echo "Failed to load metadata from suite.py." 1>&2 && exit 1

OS_NAME=$(uname -s | tr '[:upper:]' '[:lower:]')
[[ "${OS_NAME}" == msys* || "${OS_NAME}" == cygwin* || "${OS_NAME}" == mingw* ]] && OS_NAME="windows"
OS_ARCH="amd64"
[[ "${OS_NAME}" == "linux" ]] && [[ "$(dpkg --print-architecture)" == "arm64" ]] && OS_ARCH="aarch64"
JAVA_HOME_SUFFIX="" && [[ "${OS_NAME}" == "darwin" ]] && JAVA_HOME_SUFFIX="/Contents/Home"
readonly OS_NAME OS_ARCH JAVA_HOME_SUFFIX


add-path() {
  echo "$(resolve-path "$1")" >> $GITHUB_PATH
}

download-asset() {
  local filename=$1
  local git_tag=$2
  local target="${3:-$1}"

  curl -s -L --retry 3 --retry-connrefused --retry-delay 2 -o "${target}" \
    "https://github.com/hpi-swa/trufflesqueak/releases/download/${git_tag}/${filename}"
}

enable-jdk() {
  add-path "$1/bin"
  set-env "JAVA_HOME" "$(resolve-path "$1")"
}

resolve-path() {
  if [[ "${OS_NAME}" == "windows" ]]; then
    # Convert Unix path to Windows path
    echo "$1" | sed 's/\/c/C:/g' | sed 's/\//\\/g'
  else
    echo "$1"
  fi
}

set-env() {
  echo "$1=$2" >> $GITHUB_ENV
}

set-up-labsjdk11() {
  local target_dir=$1
  local jdk_tar=${target_dir}/jdk.tar.gz
  local jdk_name="labsjdk-ce-${DEP_JDK11}+${DEP_JDK11_UPDATE}-${DEP_JVMCI}-${OS_NAME}-${OS_ARCH}"

  pushd "${target_dir}" > /dev/null

  curl -sSL --retry 3 -o "${jdk_tar}" "https://github.com/graalvm/labs-openjdk-11/releases/download/${DEP_JVMCI}/${jdk_name}.tar.gz"
  tar xzf "${jdk_tar}"

  popd > /dev/null

  enable-jdk "${target_dir}/labsjdk-ce-${DEP_JDK11}-${DEP_JVMCI}${JAVA_HOME_SUFFIX}"

  echo "[${jdk_name} set up successfully]"
}

set-up-mx() {
  shallow-clone "https://github.com/graalvm/mx.git" "master" "${HOME}/mx"
  add-path "${HOME}/mx"
  set-env "MX_HOME" "${HOME}/mx"
  echo "[mx set up successfully]"
}

shallow-clone() {
  local git_url=$1
  local git_commit_or_tag=$2
  local target_dir=$3

  mkdir "${target_dir}" || true
  pushd "${target_dir}" > /dev/null

  git init > /dev/null
  git remote add origin "${git_url}"
  git fetch --quiet --depth 1 origin "${git_commit_or_tag}"
  git reset --quiet --hard FETCH_HEAD

  popd > /dev/null
}

shallow-clone-graal() {
  local target_dir="${BASE_DIRECTORY}/../graal"

  shallow-clone "${GRAAL_URL}" "${GRAAL_VERSION}" "${target_dir}"
}

$@
