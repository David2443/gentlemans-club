const SITE_NAME = "Gentleman's Club Pitești";
const SITE_URL = 'https://www.gentlemansclub.ro';
const DEFAULT_IMAGE = `${SITE_URL}/hero-barber.png`;

const setMetaTag = (selector, attrName, attrValue, content) => {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attrName, attrValue);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
};

const setCanonical = (url) => {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }

  link.setAttribute('href', url);
};

export const setPageSeo = ({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE
}) => {
  const finalTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;

  const url = `${SITE_URL}${path}`;

  document.title = finalTitle;

  setMetaTag('meta[name="description"]', 'name', 'description', description);
  setMetaTag('meta[name="robots"]', 'name', 'robots', 'index, follow');

  setMetaTag('meta[property="og:type"]', 'property', 'og:type', 'website');
  setMetaTag('meta[property="og:url"]', 'property', 'og:url', url);
  setMetaTag('meta[property="og:title"]', 'property', 'og:title', finalTitle);
  setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
  setMetaTag('meta[property="og:image"]', 'property', 'og:image', image);
  setMetaTag('meta[property="og:site_name"]', 'property', 'og:site_name', SITE_NAME);
  setMetaTag('meta[property="og:locale"]', 'property', 'og:locale', 'ro_RO');

  setMetaTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
  setMetaTag('meta[name="twitter:title"]', 'name', 'twitter:title', finalTitle);
  setMetaTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
  setMetaTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

  setCanonical(url);
};