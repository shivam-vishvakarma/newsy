import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.47/deno-dom-wasm.ts";

export default async function (req, context) {
  const response = await context.next();
  const html = await response.text();
  const articleUrl = new URL(req.url).searchParams.get("url");

  const url = `https://news-api14.p.rapidapi.com/v2/article?url=${articleUrl}&type=html`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": Netlify.env.get("RAPIDAPI_KEY"),
      "x-rapidapi-host": "news-api14.p.rapidapi.com",
    },
  };
  const document = new DOMParser().parseFromString(html, "text/html");

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!data?.success) {
      const error = document.createElement("h2");
      error.classList.value =
        "text-center w-full text-4xl font-bold text-nowrap";
      error.innerText = "Error fetching article content";
      document.body.innerHTML = error.outerHTML;
      return new Response(document.documentElement.outerHTML, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    document.querySelector("title").innerText =
      data.data.title.slice(0, 20) +
      " | Newsy | Daily News Updates | Latest Fresh News | Newsy";
    document.querySelector("#title").textContent = data.data.title;
    document.querySelector("#timePublished").textContent = new Date(
      data.data.date
    ).toLocaleString();
    document
      .querySelector("#publisherAvtar")
      .setAttribute("src", data.data.publisher.favicon);
    document.querySelector("#publisherName").textContent =
      data.data.publisher.name;
      document.querySelector("#articleImage").setAttribute("src", data.data.thumbnail);
    document.querySelector("#articleContent").innerHTML = data.data.content;

    return new Response(document.documentElement.outerHTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);
  }
}

export const config = {
  path: "/article",
};
