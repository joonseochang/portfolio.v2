// Timeline milestones data - vertical carousel (Present first, then chronological: 2000 → 2023)

export const timelineData = [
  {
    id: 'present',
    year: 'Present',
    type: 'video',
    src: 'https://joonseo-videos.b-cdn.net/premium/About_Premium.mp4?v=5',
    srcSafari: 'https://joonseo-videos.b-cdn.net/safari/About_Safari.mp4?v=2',
    recordedDate: '2026-02-12', // Used to calculate "X days ago" dynamically
    caption: 'This is me {daysAgo} days ago. Let\'s take a look back.',
    alt: 'Recent video of Joon'
  },
  {
    id: '2000',
    year: '2000',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E6E8E4"/%3E%3Cstop offset="100%25" stop-color="%23D0D4CC"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'In Seoul, I popped into existence. Sorry world.',
    alt: 'Birth'
  },
  {
    id: '2002',
    year: '2002',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E8E4E0"/%3E%3Cstop offset="100%25" stop-color="%23D4D0C8"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'Moved to Bogota, Colombia. Ay carramba.',
    alt: 'Colombia'
  },
  {
    id: '2006',
    year: '2006',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E4E6E8"/%3E%3Cstop offset="100%25" stop-color="%23CED0D4"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'First day of school. Tears were shed.',
    alt: 'First school day'
  },
  {
    id: '2008',
    year: '2008',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E8E6E4"/%3E%3Cstop offset="100%25" stop-color="%23D4D2D0"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'Discovered video games. Productivity plummeted.',
    alt: 'Gaming era'
  },
  {
    id: '2010',
    year: '2010',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E0E4E8"/%3E%3Cstop offset="100%25" stop-color="%23C8CCD4"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'Moved back to Seoul. Culture shock.',
    alt: 'Return to Seoul'
  },
  {
    id: '2015',
    year: '2015',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E8E4DF"/%3E%3Cstop offset="100%25" stop-color="%23D4CFC8"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'Started high school. Survived somehow.',
    alt: 'High school'
  },
  {
    id: '2018',
    year: '2018',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23DFE4E8"/%3E%3Cstop offset="100%25" stop-color="%23C8CED4"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'Got into Yonsei. Parents finally proud.',
    alt: 'University admission'
  },
  {
    id: '2021',
    year: '2021',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="403" height="259"%3E%3Cdefs%3E%3ClinearGradient id="g" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" stop-color="%23E4E8DF"/%3E%3Cstop offset="100%25" stop-color="%23CED4C8"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23g)" width="403" height="259"/%3E%3C/svg%3E',
    caption: 'First internship. Imposter syndrome kicked in.',
    alt: 'Internship'
  },
  {
    id: '2023',
    year: '2023',
    image: '/images/IMG_8650.jpg',
    caption: 'Military service. Currently counting days.',
    alt: 'Military'
  }
]
