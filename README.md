# JobMap - Interactive Job Discovery

![JobMap](https://via.placeholder.com/1200x600/6366f1/ffffff?text=JobMap+-+Discover+Jobs+Near+You)

A beautiful interactive map showing startups and companies hiring nearby, with 500+ job openings pinned as markers. Built with React, Leaflet, and Supabase.

## ✨ Features

- **Full-screen Interactive Map**: Drag and zoom to explore job opportunities worldwide
- **Color-coded Markers**: Blue (Remote), Green (Hybrid), Red (Office)
- **Smart Clustering**: Jobs cluster together when zoomed out for better visualization
- **Advanced Filters**: Search, salary range, work mode, industry, experience level
- **User Authentication**: Save jobs, mark as applied, track applications
- **Job Tracker**: Dedicated page to manage saved/applied jobs with status updates
- **Dark Mode**: Beautiful dark theme with glassmorphism design
- **Mobile Responsive**: Works great on all device sizes
- **Admin Dashboard**: Manage job listings and review user suggestions

## 🚀 Tech Stack

- **Frontend**: React 19, Vite, React Router
- **Map**: Leaflet + React-Leaflet with clustering
- **Styling**: Vanilla CSS with custom design system
- **State**: Zustand
- **Backend**: Supabase (Auth, Database, RLS)
- **Animations**: Framer Motion
- **Icons**: Lucide React

## 📦 Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd jobmap
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Add your Supabase credentials to `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

5. Run the development server:
```bash
npm run dev
```

## 🗄️ Database Setup

Run the SQL from `src/lib/supabase.js` in your Supabase SQL Editor to create the required tables:
- `jobs` - Job listings
- `saved_jobs` - User saved/applied jobs
- `job_suggestions` - User-submitted job suggestions
- `profiles` - User profiles

## 🎨 Design Features

- **Glassmorphism**: Frosted glass effect on sidebar and cards
- **Gradient Text**: Beautiful gradient branding
- **Smooth Animations**: Page transitions and micro-interactions
- **Custom Markers**: SVG markers colored by work mode
- **Dark Mode**: Full dark theme support
- **Responsive**: Mobile-first with bottom sheet filters

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

### Netlify

```bash
npm run build
# Deploy the `dist` folder
```

### Docker

```dockerfile
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📁 Project Structure

```
jobmap/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AuthModal.jsx
│   │   ├── Header.jsx
│   │   ├── JobCard.jsx
│   │   ├── JobMarker.jsx
│   │   ├── Map.jsx
│   │   ├── Sidebar.jsx
│   │   └── SuggestionModal.jsx
│   ├── lib/
│   │   ├── store.js        # Zustand store
│   │   └── supabase.js     # Supabase client
│   ├── pages/
│   │   ├── AdminPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── JobPage.jsx
│   │   └── TrackerPage.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css           # Design system
│   └── main.jsx
├── .env.example
├── index.html
└── package.json
```

## 🔧 Configuration

The app comes with 500 mock jobs pre-loaded for demo purposes. To use real data:

1. Set up Supabase tables using the provided SQL
2. Add your Supabase credentials to `.env`
3. The app will automatically fetch from Supabase
4. If Supabase fails, it falls back to mock data

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Credits

- Map tiles by [CARTO](https://carto.com/)
- Icons by [Lucide](https://lucide.dev/)
- Fonts by [Google Fonts](https://fonts.google.com/)

---

Built with ❤️ by Dhiraj kale
