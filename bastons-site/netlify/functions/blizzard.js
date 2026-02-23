// netlify/functions/blizzard.js
const CLIENT_ID     = process.env.BLIZZARD_CLIENT_ID;
const CLIENT_SECRET = process.env.BLIZZARD_CLIENT_SECRET;
const REGION        = 'eu';
const REALM         = 'hyjal';
const GUILD         = 'bastons-et-barils';
const LOCALE        = 'fr_FR';
const API_BASE      = `https://${REGION}.api.blizzard.com`;

async function getToken() {
  const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const { access_token } = await res.json();
  return access_token;
}

async function bnet(token, path) {
  const url = `${API_BASE}${path}&access_token=${token}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}: ${path}`);
  return res.json();
}

exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const token = await getToken();

    // Roster
    const rosterData = await bnet(token,
      `/data/wow/guild/${REALM}/${GUILD}/roster?namespace=profile-${REGION}&locale=${LOCALE}`
    );

    // Achievements (optionnel)
    let recentAchieves = [];
    try {
      const achieveData = await bnet(token,
        `/data/wow/guild/${REALM}/${GUILD}/achievements?namespace=profile-${REGION}&locale=${LOCALE}`
      );
      recentAchieves = (achieveData.achievements || [])
        .filter(a => a.completed_timestamp)
        .sort((a, b) => b.completed_timestamp - a.completed_timestamp)
        .slice(0, 5)
        .map(a => ({
          name: a.achievement?.name || '—',
          date: new Date(a.completed_timestamp).toLocaleDateString('fr-FR'),
        }));
    } catch(e) { console.warn('Achievements error:', e.message); }

    // iLvl des 25 premiers membres actifs
    const activeMembers = rosterData.members
      .filter(m => m.rank <= 5)
      .slice(0, 25);

    const membersWithGear = await Promise.allSettled(
      activeMembers.map(async m => {
        const base = {
          name:  m.character.name,
          rank:  m.rank,
          level: m.character.level,
          playable_class: m.character.playable_class?.name || '—',
          equipped_item_level: 0,
        };
        try {
          const slug = m.character.realm?.slug || REALM;
          const name = m.character.name.toLowerCase();
          const gear = await bnet(token,
            `/profile/wow/character/${slug}/${name}/equipment?namespace=profile-${REGION}&locale=${LOCALE}`
          );
          return { ...base, equipped_item_level: gear.equipped_item_level || 0 };
        } catch { return base; }
      })
    );

    const members = membersWithGear
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value)
      .sort((a, b) => a.rank - b.rank || b.equipped_item_level - a.equipped_item_level);

    const withIlvl = members.filter(m => m.equipped_item_level > 0);
    const avgIlvl  = withIlvl.length
      ? Math.round(withIlvl.reduce((s, m) => s + m.equipped_item_level, 0) / withIlvl.length)
      : 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        roster:        members,
        total_members: rosterData.members.length,
        avg_ilvl:      avgIlvl,
        achievements:  recentAchieves,
      }),
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
