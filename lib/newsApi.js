
// Multiple free news sources for crypto news
export const getCryptoNews = async () => {
  try {
    // CoinTelegraph RSS feed (free)
    const sources = [
      {
        name: 'CoinTelegraph',
        url: 'https://cointelegraph.com/rss',
        parser: 'rss'
      },
      {
        name: 'CoinDesk',
        url: 'https://feeds.feedburner.com/CoinDesk',
        parser: 'rss'
      }
    ];

    // Using RSS to JSON service (free)
    const allNews = [];
    
    for (const source of sources) {
      try {
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(source.url)}&count=10`
        );
        
        const data = await response.json();
        
        if (data.status === 'ok' && data.items) {
          const articles = data.items.map(item => ({
            title: item.title,
            description: item.description?.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
            url: item.link,
            publishedAt: new Date(item.pubDate),
            source: source.name,
            image: item.thumbnail || item.enclosure?.link
          }));
          
          allNews.push(...articles);
        }
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
      }
    }
    
    // Sort by date and remove duplicates
    const uniqueNews = allNews
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .filter((article, index, self) => 
        index === self.findIndex(a => a.title === article.title)
      )
      .slice(0, 20); // Latest 20 articles
    
    return uniqueNews;
  } catch (error) {
    console.error('Error fetching crypto news:', error);
    return [];
  }
};

// Alternative: CryptoNews API (free tier)
export const getCryptoNewsAlternative = async () => {
  try {
    // Using CryptoNews free API
    const response = await fetch(
      'https://cryptonews-api.com/api/v1/category?section=general&items=20&token=free'
    );
    
    const data = await response.json();
    
    if (data.data) {
      return data.data.map(article => ({
        title: article.title,
        description: article.text?.substring(0, 150) + '...',
        url: article.news_url,
        publishedAt: new Date(article.date),
        source: article.source_name,
        image: article.image_url
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching alternative crypto news:', error);
    return [];
  }
};

// Combined news fetcher with fallback
export const getAllCryptoNews = async () => {
  try {
    let news = await getCryptoNews();
    
    if (news.length === 0) {
      news = await getCryptoNewsAlternative();
    }
    
    return news;
  } catch (error) {
    console.error('Error fetching all crypto news:', error);
    return [];
  }
};
