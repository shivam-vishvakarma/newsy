import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.47/deno-dom-wasm.ts";

export default async function (req, context) {
  const response = await context.next();
  const html = await response.text();
  const category = new URL(req.url).searchParams.get("category");
  let url = `https://news-api14.p.rapidapi.com/v2/search/articles?query=${context.geo.city}&language=en`;
  if (category) {
    url = `https://news-api14.p.rapidapi.com/v2/trendings?topic=${category}&language=en&country=${context.geo.country.code}`;
  }
  url = new URL(url);
  url.searchParams.set("page", new URL(req.url).searchParams.get("p") || 1);
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": Netlify.env.get("RAPIDAPI_KEY"),
      "x-rapidapi-host": "news-api14.p.rapidapi.com",
    },
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();

    const document = new DOMParser().parseFromString(html, "text/html");
    const articleContainer = document.querySelector("article").parentNode;

    // throwing not found if there is any error

    if (!data?.success) {
      const error = document.createElement("h2");
      error.classList.value =
        "text-center w-full text-4xl font-bold text-nowrap";
      error.innerText = "Error fetching articles";
      articleContainer.innerHTML = error.outerHTML;
      return new Response(document.documentElement.outerHTML, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    const article = articleContainer.querySelector("article");

    // adding articles dynamically

    if (data.data.length == 0) {
      const error = document.createElement("h2");
      error.classList.value =
        "text-center w-full text-4xl font-bold text-nowrap";
      error.innerText = "No articles found";
      articleContainer.innerHTML = error.outerHTML;
      return new Response(document.documentElement.outerHTML, {
        status: 200,
        headers: {
          "content-type": "text/html; charset=utf-8",
        },
      });
    }

    data.data.forEach((articleData) => {
      const newArticle = article.cloneNode(true);
      newArticle.querySelector("h2").innerText = articleData.title;
      newArticle.querySelector("p").innerText = articleData.excerpt;
      newArticle
        .querySelector("a")
        .setAttribute("href", `/article?url=${articleData.url}`);
      newArticle
        .querySelector("img")
        .setAttribute("src", articleData.thumbnail);
      articleContainer.appendChild(newArticle);
    });
    articleContainer.removeChild(article);

    // working with pagination

    const pagination = document.querySelector("#pagination");
    const numButton = pagination.querySelector("#num");
    const redirectUrl = new URL(req.url);
    const current_page = parseInt(new URL(req.url).searchParams.get("p") || 1);
    // previous button
    if (current_page <= 1) {
      pagination.querySelector("#prev").remove();
    } else {
      redirectUrl.searchParams.set("p", current_page - 1);
      pagination.querySelector("#prev>a").setAttribute("href", redirectUrl);
    }
    // next button
    if (current_page >= data.totalPages) {
      pagination.querySelector("#next").remove();
    } else {
      redirectUrl.searchParams.set("p", current_page + 1);
      pagination.querySelector("#next>a").setAttribute("href", redirectUrl);
    }
    // number buttons
    let i = 1;
    // adding buttons from start to current page or only 2 buttons
    while (i <= data.totalPages && i <= 2) {
      const new_button = numButton.cloneNode(true);
      new_button.querySelector("a").innerText = `${i}`;
      redirectUrl.searchParams.set("p", i);
      new_button.querySelector("a").setAttribute("href", redirectUrl);
      if (i == current_page) {
        new_button.querySelector("a").classList.remove("text-gray-400");
        new_button.querySelector("a").classList.add("text-blue-700");
      }
      numButton.before(new_button);
      i++;
    }
    // adding ... button if current button is lover then current page -1
    if (i < current_page - 1) {
      const new_button = numButton.cloneNode(true);
      new_button.querySelector("a").innerText = "...";
      numButton.before(new_button);
    }

    // setting the i to showing current page -1 button or as index
    i = i < current_page - 1 ? current_page - 1 : i;
    // adding buttons from current page -1 to current page +1
    while (i <= data.totalPages && i <= current_page + 1) {
      const new_button = numButton.cloneNode(true);
      new_button.querySelector("a").innerText = `${i}`;
      redirectUrl.searchParams.set("p", i);
      new_button.querySelector("a").setAttribute("href", redirectUrl);
      if (i == current_page) {
        new_button.querySelector("a").classList.remove("text-gray-400");
        new_button.querySelector("a").classList.add("text-blue-700");
      }
      numButton.before(new_button);
      i++;
    }
    // adding ... button if current button is lover then highest page number
    if (i <= data.totalPages - 2) {
      const new_button = numButton.cloneNode(true);
      new_button.querySelector("a").innerText = "...";
      numButton.before(new_button);
    }

    // setting the i to showing max page -1 button or as index
    i = i <= data.totalPages - 1 ? data.totalPages - 1 : i;
    // adding buttons from max page -1 to max page
    while (i <= data.totalPages) {
      const new_button = numButton.cloneNode(true);
      new_button.querySelector("a").innerText = `${i}`;
      redirectUrl.searchParams.set("p", i);
      new_button.querySelector("a").setAttribute("href", redirectUrl);
      numButton.before(new_button);
      i++;
    }
    numButton.remove();

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
  path: "/articles",
};
