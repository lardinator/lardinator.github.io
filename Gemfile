source "https://rubygems.org"

# GitHub Pages serves a specific set of Jekyll plugins / versions. Using this
# gem locks us to whatever GH Pages currently supports — so what runs locally
# matches what they build.
gem "github-pages", group: :jekyll_plugins

# Optional but useful when developing.
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-sitemap"
end

# Performance booster for Linux/Windows dev (not Mac).
gem "wdm", "~> 0.1", platforms: [:mingw, :x64_mingw, :mswin]

# Ruby 3.x lock for tzinfo.
gem "tzinfo", ">= 1", "< 3"
gem "tzinfo-data", platforms: [:mingw, :x64_mingw, :mswin, :jruby]
gem "webrick", "~> 1.7"
