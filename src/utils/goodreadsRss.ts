interface GoodreadsBook {
  title: string;
  author: string;
  description: string;
  pubDate: Date;
  url: string;
  heroImage: string;
  goodreadsId?: string;
  averageRating?: string;
}

// Fetch Goodreads "Want to Read" books using RSS feed
export async function fetchGoodreadsWantToRead(
  userId: string,
  limit: number = 20
): Promise<GoodreadsBook[]> {
  try {
    // Fetch RSS feed from Goodreads
    const response = await fetch(
      `https://www.goodreads.com/review/list_rss/${userId}?shelf=to-read`
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch Goodreads RSS: ${response.status}`
      );
    }

    const xmlData = await response.text();
    const books: GoodreadsBook[] = [];

    // Parse RSS items using regex
    const itemMatches = xmlData.match(/<item>([\s\S]*?)<\/item>/g);

    if (itemMatches) {
      itemMatches.slice(0, limit).forEach((item, index) => {
        // Extract title (clean title without author)
        const titleMatch = item.match(/<title>(.*?)<\/title>/);
        const title = titleMatch
          ? titleMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
              .trim()
          : 'Unknown Title';

        // Extract author from author_name field
        const authorMatch = item.match(
          /<author_name>(.*?)<\/author_name>/
        );
        const author = authorMatch
          ? authorMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
              .trim()
          : 'Unknown Author';

        // Extract book description from book_description field
        const bookDescriptionMatch = item.match(
          /<book_description>(.*?)<\/book_description>/
        );
        const bookDescription = bookDescriptionMatch
          ? bookDescriptionMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
              .replace(/<[^>]*>/g, '')
              .trim()
          : '';

        // Extract description from description field (fallback)
        const descriptionMatch = item.match(
          /<description>(.*?)<\/description>/
        );
        const description = descriptionMatch
          ? descriptionMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
              .replace(/<[^>]*>/g, '')
              .trim()
          : '';

        // Use book_description if available, otherwise use description
        const finalDescription =
          bookDescription ||
          description ||
          'No description available';

        // Extract link
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const url = linkMatch
          ? linkMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim()
          : '';

        // Extract pubDate
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        const pubDate = pubDateMatch
          ? new Date(
              pubDateMatch[1]
                .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
                .trim()
            )
          : new Date();

        // Extract Goodreads ID from book_id field
        const bookIdMatch = item.match(/<book_id>(\d+)<\/book_id>/);
        const goodreadsId = bookIdMatch ? bookIdMatch[1] : undefined;

        // Extract average rating
        const averageRatingMatch = item.match(
          /<average_rating>([\d.]+)<\/average_rating>/
        );
        const averageRating = averageRatingMatch
          ? averageRatingMatch[1]
          : undefined;

        // Extract large image URL from book_large_image_url field
        const largeImageMatch = item.match(
          /<book_large_image_url>(.*?)<\/book_large_image_url>/
        );
        let heroImage = '';
        if (largeImageMatch) {
          // Remove CDATA wrapper if present
          const largeImageUrl = largeImageMatch[1]
            .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
            .trim();
          heroImage = largeImageUrl;
        }

        // Fallback to medium image if large not available
        if (!heroImage) {
          const mediumImageMatch = item.match(
            /<book_medium_image_url>(.*?)<\/book_medium_image_url>/
          );
          if (mediumImageMatch) {
            const mediumImageUrl = mediumImageMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
              .trim();
            heroImage = mediumImageUrl;
          }
        }

        // Fallback to small image if medium not available
        if (!heroImage) {
          const smallImageMatch = item.match(
            /<book_small_image_url>(.*?)<\/book_small_image_url>/
          );
          if (smallImageMatch) {
            const smallImageUrl = smallImageMatch[1]
              .replace(/<!\[CDATA\[(.*?)\]\]>/, '$1')
              .trim();
            heroImage = smallImageUrl;
          }
        }

        // Final fallback to placeholder
        if (!heroImage) {
          heroImage =
            'https://via.placeholder.com/300x450/cccccc/666666?text=Book+Cover';
        }

        books.push({
          title,
          author,
          description: finalDescription,
          pubDate,
          url,
          heroImage,
          goodreadsId,
          averageRating,
        });
      });
    }

    console.log('Parsed Goodreads books:', books.length, books);
    return books;
  } catch (error) {
    console.error('Error fetching Goodreads books:', error);
    return [];
  }
}
