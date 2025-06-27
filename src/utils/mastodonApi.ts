interface MastodonStatus {
  id: string;
  uri: string;
  url: string;
  account: {
    id: string;
    username: string;
    acct: string;
    display_name: string;
    locked: boolean;
    bot: boolean;
    discoverable: boolean;
    group: boolean;
    created_at: string;
    note: string;
    url: string;
    avatar: string;
    avatar_static: string;
    header: string;
    header_static: string;
    followers_count: number;
    following_count: number;
    statuses_count: number;
    last_status_at: string;
    emojis: any[];
    fields: any[];
  };
  in_reply_to_id: string | null;
  in_reply_to_account_id: string | null;
  reblog: any | null;
  poll: any | null;
  card: any | null;
  language: string | null;
  content: string;
  edited_at: string | null;
  favourited: boolean;
  reblogged: boolean;
  muted: boolean;
  bookmarked: boolean;
  pinned: boolean;
  filtered: any[];
  favourites_count: number;
  reblog_count: number;
  replies_count: number;
  score: number;
  visibility: string;
  spoiler_text: string;
  created_at: string;
  in_reply_to_uri: string | null;
  tags: Array<{
    name: string;
    url: string;
  }>;
  emojis: any[];
  application: any | null;
  media_attachments: Array<{
    id: string;
    type: string;
    url: string;
    preview_url: string;
    remote_url: string | null;
    preview_remote_url: string | null;
    text_url: string | null;
    meta: any;
    description: string | null;
    blurhash: string | null;
  }>;
  mentions: any[];
  reblogs: any[];
  quote: any | null;
}

interface MastodonPost {
  collection: string;
  id: string;
  data: {
    title: string;
    profileImage: string;
    description: string;
    pubDate: Date;
    url: string;
    media: {
      url: string;
      type: string;
      description?: string;
      blurhash?: string;
    }[];
    tags: string[];
    engagement?: {
      favourites: number;
      reblogs: number;
      replies: number;
    };
    spoilerText?: string;
    language?: string;
    visibility?: string;
    isReply?: boolean;
    isReblog?: boolean;
    hasPoll?: boolean;
    hasCard?: boolean;
    customEmojis?: string[];
    mentions?: string[];
  };
}

export async function fetchMastodonPosts(
  username: string = 'ruwaizrazak',
  instance: string = 'mastodon.social',
  limit: number = 20
): Promise<MastodonPost[]> {
  try {
    // Fetch account information first to get the account ID
    const accountResponse = await fetch(
      `https://${instance}/api/v1/accounts/lookup?acct=${username}`
    );
    if (!accountResponse.ok) {
      throw new Error(
        `Failed to fetch account info: ${accountResponse.status}`
      );
    }

    const account = await accountResponse.json();

    // Fetch statuses using the account ID
    const statusesResponse = await fetch(
      `https://${instance}/api/v1/accounts/${account.id}/statuses?limit=${limit}&exclude_replies=true&exclude_reblogs=true`
    );
    if (!statusesResponse.ok) {
      throw new Error(
        `Failed to fetch statuses: ${statusesResponse.status}`
      );
    }

    const statuses: MastodonStatus[] = await statusesResponse.json();

    // Transform Mastodon statuses to our post format
    const posts: MastodonPost[] = statuses.map((status) => {
      // Extract text content, removing HTML tags
      const textContent = status.content.replace(/<[^>]*>/g, '');

      // Extract all media attachments with enhanced info
      const media = status.media_attachments.map((attachment) => ({
        url: attachment.url,
        type: attachment.type,
        description: attachment.description || undefined,
        blurhash: attachment.blurhash || undefined,
      }));

      // Extract tags
      const tags = status.tags.map((tag) => tag.name);

      // Extract mentions
      const mentions = status.mentions.map((mention) => mention.acct);

      // Extract custom emojis
      const customEmojis = status.emojis.map(
        (emoji) => emoji.shortcode
      );

      return {
        collection: 'mastodon',
        id: status.id,
        data: {
          title: new Date(status.created_at).toLocaleDateString(
            'en-US',
            {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }
          ),
          profileImage: account.avatar,
          description: textContent,
          pubDate: new Date(status.created_at),
          url: status.url,
          media,
          tags,
          // Enhanced data from API
          engagement: {
            favourites: status.favourites_count,
            reblogs: status.reblog_count,
            replies: status.replies_count,
          },
          spoilerText: status.spoiler_text || undefined,
          language: status.language || undefined,
          visibility: status.visibility,
          isReply: !!status.in_reply_to_id,
          isReblog: !!status.reblog,
          hasPoll: !!status.poll,
          hasCard: !!status.card,
          customEmojis:
            customEmojis.length > 0 ? customEmojis : undefined,
          mentions: mentions.length > 0 ? mentions : undefined,
        },
      };
    });

    return posts;
  } catch (error) {
    console.error('Error fetching Mastodon posts:', error);
    return [];
  }
}
