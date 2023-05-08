# really-simple-jquery-cache
Simple jQuery cache that routes ajax GET calls via the browser's session storage. A one line include.

**NB** Written with the help of ChatGPT, so you know, robot warning.

## Overview
The use case I have in mind is fetching the same file multiple times via AJAX calls, where there is limited opportunity to refactor the code to reduce the number of requests, e.g. dynamically generated code.

Makes use of [`ajaxPrefilter`](http://api.jquery.com/jquery.ajaxprefilter/) to monkey patch `$.ajax` calls. It uses the browser's [session storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) to try cache the data being fetched, as well as implement a simple locking mechanism to avoid parallel calls racing to fetch from source.

## Use
Should be as simple as including the following script tag in your project of choice:

```html
<script src="https://cdn.jsdelivr.net/gh/Gordonei/really-simple-jquery-cache@main/jquery-cacher.js"></script>
```

## Caveats
I haven't really tested this with anything except GET calls that return JSON. I've tried to put a bit of defensive coding in to limit its use to that scenario.
