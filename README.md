# 🎯 Practical Tracker

**Open-source match tracker for practical shooting competitors.**

Log your matches, track your ammo cost, develop loads, and monitor your gun — all in one place. Supports USPSA, Steel Challenge (SCSA), IPSC, IDPA, 3-Gun, PRS, NRL22, and more.

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

---

## Features

- **Match History** — Log placements, stage scores, rounds used, and power factor across all disciplines and divisions
- **Expense Tracker** — Track your full build cost, match fees, ammo, and reloading supplies
- **Chrono / Load Dev** — Log velocity strings, auto-calculate power factor, track loads over time
- **Maintenance Log** — Round counter with service interval alerts (configurable per gun)
- **Multi-Gun** — Track multiple builds independently
- **Multi-User** — Each shooter has their own account, data syncs across devices
- **Export / Import** — JSON backup at any time

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Auth | [NextAuth.js v4](https://next-auth.js.org) |
| Database | [PostgreSQL](https://postgresql.org) via [Prisma ORM](https://prisma.io) |
| Hosting | [Vercel](https://vercel.com) |
| DB Host | [Supabase](https://supabase.com) (recommended free tier) |
| Charts | [Recharts](https://recharts.org) |
| Validation | [Zod](https://zod.dev) |

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Supabase free tier recommended)
- GitHub or Google OAuth app credentials

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/practical-tracker.git
cd practical-tracker
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
DATABASE_URL="postgresql://..."        # Your Postgres connection string
NEXTAUTH_SECRET="..."                  # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
GITHUB_ID="..."                        # From github.com/settings/developers
GITHUB_SECRET="..."
```

### 3. Set up the database

```bash
npm run db:push        # Push schema to your database
npm run db:generate    # Generate Prisma client
```

### 4. Run

```bash
npm run dev
# → http://localhost:3000
```

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add all environment variables from `.env.example` under **Settings → Environment Variables**
4. Set `NEXTAUTH_URL` to your Vercel deployment URL (e.g. `https://practical-tracker.vercel.app`)
5. Deploy — Vercel auto-deploys on every push to `main`

### Recommended free database: Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection String → URI**
3. Copy the connection string into `DATABASE_URL`
4. Run `npm run db:push` to create tables

---

## Database Setup

```bash
# Push schema changes (development)
npm run db:push

# Create a named migration (before production deployment)
npm run db:migrate

# Open Prisma Studio (visual DB browser)
npm run db:studio
```

---

## Project Structure

```
practical-tracker/
├── prisma/
│   └── schema.prisma          # Full database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── matches/       # Match CRUD + stages
│   │   │   ├── expenses/      # Expense CRUD
│   │   │   ├── chrono/        # Chrono sessions
│   │   │   └── maintenance/   # Maintenance logs
│   │   ├── dashboard/         # Dashboard page
│   │   ├── matches/           # Matches pages
│   │   ├── expenses/          # Expenses pages
│   │   ├── chrono/            # Chrono pages
│   │   └── maintenance/       # Maintenance pages
│   ├── components/
│   │   ├── ui/                # Shared UI components
│   │   ├── forms/             # Form components
│   │   └── charts/            # Chart components
│   └── lib/
│       ├── prisma.ts          # Prisma singleton
│       └── constants.ts       # Disciplines, divisions, helpers
```

---

## API Reference

All endpoints require authentication (session cookie).

### Matches

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/matches` | List all matches (optional `?discipline=USPSA`) |
| `POST` | `/api/matches` | Create a match |
| `GET` | `/api/matches/:id` | Get single match |
| `PUT` | `/api/matches/:id` | Update match |
| `DELETE` | `/api/matches/:id` | Delete match |

### Expenses

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/expenses` | List all expenses |
| `POST` | `/api/expenses` | Create expense |

### Chrono

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/chrono` | List all sessions |
| `POST` | `/api/chrono` | Log session (PF auto-calculated) |

### Maintenance

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/maintenance` | List all logs |
| `POST` | `/api/maintenance` | Log service entry |

---

## Supported Disciplines

| Code | Name | Divisions |
|---|---|---|
| `USPSA` | USPSA | PCC, Open, Carry Optics, Limited, Limited 10, Single Stack, Revolver |
| `SCSA` | Steel Challenge | PCC, Open, Carry Optics, Limited, Iron Sight Revolver, Rimfire Pistol/Rifle |
| `IPSC` | IPSC | PCC, Open, Standard, Production, Classic, Revolver |
| `IDPA` | IDPA | PCC, SSP, ESP, CDP, CCP, REV, BUG, CO |
| `THREE_GUN` | 3-Gun | Open, Tactical, Limited, Heavy Metal |
| `PRS` | Precision Rifle Series | Open, Production, Factory |
| `NRL22` | NRL22 | Open, Factory |
| `RIMFIRE` | Rimfire Challenge | Open, Standard |

---

## Contributing

Contributions are welcome! This is a community project built by and for competitive shooters.

### How to contribute

1. **Fork** the repo
2. **Create a branch**: `git checkout -b feature/your-feature-name`
3. **Make your changes** and write clean, typed TypeScript
4. **Test locally**: `npm run dev`
5. **Open a Pull Request** with a clear description

### Good first issues / ideas

- [ ] Public leaderboard / community stats page
- [ ] USPSA classifier tracker and hit factor calculator
- [ ] Stage designer / course of fire builder
- [ ] PDF match card export
- [ ] Ammo inventory tracker with round count alerts
- [ ] iOS / Android PWA improvements
- [ ] Import from Practiscore CSV
- [ ] Dark/light theme toggle
- [ ] Club management (RO tools, match results publishing)

### Code style

- TypeScript strict mode throughout
- Zod validation on all API inputs
- Prisma for all DB access — no raw SQL
- Keep components small and colocated with their page

---

## Data & Privacy

- Each user's data is completely private by default
- Profiles are private unless you opt in to `isPublic: true`
- No data is sold or shared
- You can export your full dataset as JSON at any time from the app

---

## License

MIT — free to use, modify, and distribute. See [LICENSE](LICENSE).

---

## Acknowledgements

Built by competitive shooters, for competitive shooters. Started as a single-user PCC tracker for an Aero Precision EPC-9 GRS build, and grew into something the whole community can use.

If you find this useful, star the repo and consider contributing a feature your squad needs.
