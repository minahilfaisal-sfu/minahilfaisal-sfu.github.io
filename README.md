# minahilfaisal-sfu.github.io

My personal website — **https://minahilfaisal-sfu.github.io**

Full-stack software engineer and graduate researcher, doing an MSc at Simon Fraser University's School of Interactive Arts & Technology (SIAT). The site has my professional timeline and portfolio, my projects (course work and things I build on my own), and a blog.

Plain HTML, CSS and [p5.js](https://p5js.org), hosted on GitHub Pages. The blog is written in Markdown and built by GitHub's Jekyll on every push.

## What's where

```
├── index.html              home page: intro + professional timeline
├── style.css               shared styles for every page (colors are at the top)
├── vines.js                decorative p5.js vines in the side margins on wide screens
│
├── portfolio/
│   ├── index.html          where I've worked + selected projects
│   ├── portfolio.css
│   └── logos/              company / institution logos
│
├── projects/
│   ├── index.html          course work and personal projects
│   ├── iat-806/            IAT 806 labs and assignments, one folder each
│   └── task-queue/         to-do queue with week + calendar planning (p5.js)
│
├── blog/
│   ├── index.html          list of posts (fills itself in)
│   ├── blog.css
│   └── images/             images used in posts
├── _posts/                 blog posts, one Markdown file each
├── _drafts/                post template (never published)
├── _layouts/post.html      the page every post is wrapped in
└── _config.yml             blog settings: site title, URL, plugins
```

## Working on it locally

For the HTML pages, open the folder in VS Code and use the **Live Server** extension (right-click `index.html` → **Open with Live Server**). Pages reload on save.

Blog pages are built by Jekyll, so they only render properly on the live site — or locally with Jekyll installed:

```sh
gem install jekyll jekyll-seo-tag jekyll-sitemap jekyll-feed
jekyll serve        # then open http://localhost:4000
```

Pushing to `main` publishes everything within a minute or two. If the live site looks stale, hard-refresh (`Cmd+Shift+R`).

## Updating the timeline and portfolio

- **Timeline** — the `<ol class="timeline">` list in `index.html`. Newest first; copy an `<li>` block to add an entry.
- **Where I've worked** — the logo tiles in `portfolio/index.html`. Drop the logo into `portfolio/logos/` with the file name the tile points to (e.g. `arbisoft.png`). Until the file exists, the tile just shows the name.
- **Selected projects** — the project cards in `portfolio/index.html`, each with its own links.

## Adding a project

Each project is a folder under `projects/` with its own `index.html`. IAT 806 work goes in `projects/iat-806/` (copy `template/` to start); personal projects go straight under `projects/`. Then add a card linking to it in `projects/index.html` (or `projects/iat-806/index.html`).

p5.js is loaded from the CDN (`p5@2.3.3`). Things learned the hard way:

- Don't name your own functions or variables after p5 built-ins (`save`, `LEFT`, `CENTER`…) — p5 won't warn you, it just breaks.
- Keep file names lowercase with no spaces; GitHub Pages is case-sensitive even when your Mac isn't.
- Each folder links `style.css` with one `../` per level it's nested (`../../style.css` from `projects/iat-806/`).

## Writing a blog post

1. Copy `_drafts/post-template.md` into `_posts/`.
2. Rename it to the date and a short title: `_posts/2026-10-25-what-i-learned-about-p5.md`.
   The part after the date becomes the address: `/blog/what-i-learned-about-p5/`.
3. Fill in `title`, `description` and `tags` at the top, write the post, commit and push.

The Blog page, sitemap and RSS feed update themselves. Images go in `blog/images/` and are referenced as `/blog/images/name.png`.

A Notion page exported as Markdown works too — paste it in under the three lines at the top.

## Search engines

Jekyll generates `/sitemap.xml` (every page), `/blog/feed.xml` (RSS) and the title/description tags on each post. To get new posts crawled sooner, add the site to [Google Search Console](https://search.google.com/search-console) once and submit `https://minahilfaisal-sfu.github.io/sitemap.xml`; resubmit after adding a batch of posts.
