import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.47/deno-dom-wasm.ts";

export default async function (_req, context) {
  const response = await context.next();
  const html = await response.text();
  const key = Netlify.env.get("RAPIDAPI_KEY");
  const url = "https://news-api14.p.rapidapi.com/v2/info/topics";
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": key,
      "x-rapidapi-host": "news-api14.p.rapidapi.com",
    },
  };
  const document = new DOMParser().parseFromString(html, "text/html");

  try {
    const res = await fetch(url, options);
    const result = await res.json();
    const parent_category = document.getElementById("categoryContainer");
    const main_category = parent_category.querySelector("#main_category");
    result.data.forEach((category) => {
      const new_main_category = main_category.cloneNode(true);
      new_main_category.querySelector("h2").innerText = category.name;
      const card_div = new_main_category.querySelector("#card_div");
      const card = card_div.querySelector("#card");
      category.subtopics.forEach((subtopic) => {
        const new_card = card.cloneNode(true);
        new_card.querySelector("h5").innerText = subtopic;
        new_card.setAttribute(
          "href",
          `/articles?category=${subtopic.toLowerCase()}`
        );
        card_div.appendChild(new_card);
      });
      card.querySelector("h5").innerText = category.name;
      card.setAttribute(
        "href",
        `/articles?category=${category.name.toLowerCase()}`
      );
      parent_category.appendChild(new_main_category);
    });
    parent_category.removeChild(main_category);
    return new Response(document.documentElement.outerHTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error(error);
    return;
  }
}

export const config = {
  path: "/categories",
};
