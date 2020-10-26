require "open-uri"
require "json"

# <Example :name="httpbin" url="'https://httpbin.org/get'" />
# <Example :name="Wikipedia" url="'https://en.wikipedia.org/w/api.php?action=query&amp;list=search&amp;srsearch=Craig%20Noone&amp;format=json'" />
# <Example :name="Hackernews" url="'https://hacker-news.firebaseio.com/v0/user/jl.json'" />
def downloadAndInspectJSONKeys(url)
    data = JSON.parse(open(url, &:read))
    # <Assertion :expression="!data.keys.empty?" />
    data.keys
end
