export async function get() {
  return {
    body: JSON.stringify({
      subject: 'acct:ruwaizrazak@mastodon.social',
      aliases: [
        'https://mastodon.social/@ruwaizrazak',
        'https://mastodon.social/users/ruwaizrazak',
      ],
      links: [
        {
          rel: 'http://webfinger.net/rel/profile-page',
          type: 'text/html',
          href: 'https://mastodon.social/@ruwaizrazak',
        },
        {
          rel: 'self',
          type: 'application/activity+json',
          href: 'https://mastodon.social/users/ruwaizrazak',
        },
        {
          rel: 'http://ostatus.org/schema/1.0/subscribe',
          template:
            'https://mastodon.social/authorize_interaction?uri={uri}',
        },
      ],
    }),
  };
}
