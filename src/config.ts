import babyPhoneImage from "./assets/projects/baby-phone.png";
import b1AtlasImage from "./assets/projects/b1-atlas.png";
import sellEazyyImage from "./assets/projects/selleazyy.png";

// Grouped for the About section; `skills` flattens them for JSON-LD.
// Wide groups span both columns of the skills grid.
const skillGroups = [
  {
    label: "Backend",
    wide: true,
    skills: [
      "Java",
      "Kotlin",
      "Spring Boot",
      "Node.js",
      "Laravel",
      "PostgreSQL",
      "Prisma",
      "GraphQL",
      "REST APIs",
      "Kafka",
      "Redis/BullMQ",
      "Microservices",
      "Mockito",
    ],
  },
  {
    label: "Frontend",
    wide: true,
    skills: [
      "JavaScript",
      "TypeScript",
      "Angular",
      "React",
      "React Router",
      "NextJS",
      "Tanstack Start",
      "Astro",
      "Tailwind CSS",
      "Jest",
    ],
  },
  {
    label: "Mobile",
    wide: false,
    skills: ["Swift", "SwiftUI", "StoreKit"],
  },
  {
    label: "Tools & Platforms",
    wide: false,
    skills: ["Docker", "AWS", "Git", "CI/CD", "Shopify Apps"],
  },
  {
    label: "Product & Delivery",
    wide: true,
    skills: ["Product Development", "Stakeholder Management", "Business Process Improvement"],
  },
];

export const siteConfig = {
  name: "Yousuf Khan",
  title: "Senior Software Engineer",
  description: "Full Stack Software Engineer with 10+ years of experience in logistics, healthcare, and e-commerce",
  accentColor: "#0f4c5c",
  // Add your profile image URL here (relative to /public folder or absolute URL)
  // Example: "/profile.jpg" or "https://example.com/profile.jpg"
  profileImage: "/profile.webp", // Leave empty to use placeholder
  social: {
    email: "ratulcse27@gmail.com",
    linkedin: "https://www.linkedin.com/in/ratul20/",
    medium: "https://medium.com/@rats",
    resume: "https://files.selleazyy.com/cv.pdf",
    github: "https://github.com/ratul0",
  },
  aboutMe:
    "Ten years as a full-stack engineer have taught me to care just as much about the \"why\" as the \"how.\" At Kuehne+Nagel, this meant acting as a natural bridge between the business side and the developers. My strength lies in taking a product owner's big idea and turning it into a realistic plan that a team can actually ship. I’m at my best when balancing a strong technical vision with a solid delivery timeline to ensure the right problems are solved on schedule.",
  skillGroups,
  skills: skillGroups.flatMap((group) => group.skills),
  languages: [
    { name: "English", level: 5 },
    { name: "Bangla", level: 5 },
    { name: "German", level: 3 },
  ],
  projects: [
    {
      name: "Baby Phone",
      tagline: "ABC & 123 Games for toddlers",
      kind: "iOS app",
      dateRange: "Sep 2026 - Present",
      status: "Live",
      link: "https://apps.apple.com/sa/app/baby-phone-abc-123-games/id6823124937",
      linkLabel: "App Store",
      image: babyPhoneImage,
      imageAlt:
        "Baby Phone showcase: offline learning for toddlers in English and Arabic, with three iPhone screens of the app",
      description:
        "An educational iOS app for toddlers. I own the product decisions, development, App Store delivery and ongoing maintenance.",
      highlights: [
        "English and Arabic activities covering letters, numbers, animal sounds and pretend phone calls.",
        "Offline use, personalised family photos and voice greetings, parental controls and an in-app purchase.",
        "Reusable functionality in a shared Swift package, with unit and UI test targets.",
      ],
      skills: ["Swift", "SwiftUI", "StoreKit"],
    },
    {
      name: "B1 Atlas",
      tagline: "German learning and relocation planning",
      kind: "Web platform",
      dateRange: "Aug 2026 - Present",
      status: "Live",
      link: "https://b1atlas.com/",
      linkLabel: "b1atlas.com",
      image: b1AtlasImage,
      imageAlt:
        "B1 Atlas showcase: German learning and relocation planning, with a screenshot of the guides and tools page",
      description:
        "A platform that helps people prepare for German language exams and plan a move to Germany. I own the product direction, development, deployment and maintenance.",
      highlights: [
        "Multilingual site combining practical guides with interactive tools for exam selection, Ausbildung applications and Opportunity Card planning.",
        "Guided user journeys and a waitlist for a structured self-study course in development.",
      ],
      skills: ["Astro", "TypeScript", "Tailwind CSS"],
    },
    {
      name: "SellEazyy",
      tagline: "Shopify apps for merchant operations",
      kind: "Shopify apps",
      dateRange: "Mar 2026 - Present",
      status: "Live",
      link: "https://selleazyy.com/",
      linkLabel: "selleazyy.com",
      image: sellEazyyImage,
      imageAlt: "SellEazyy logo on a blue background: Shopify apps, finally done right",
      description:
        "StockPing and OrderPing, two Shopify apps that automate inventory monitoring and order notifications. I own product decisions, development, deployment and maintenance.",
      highlights: [
        "StockPing: location-specific low-stock alerts, recovery notifications and daily summaries.",
        "OrderPing: routes order notifications to the right staff through configurable rules.",
        "Shopify API and webhook integrations, background processing, multi-channel notifications and Shopify billing.",
      ],
      skills: ["TypeScript", "React Router", "Node.js", "PostgreSQL", "Prisma", "Redis/BullMQ", "Docker"],
    },
  ],
  experience: [
    {
      company: "Kuehne+Nagel",
      title: "Senior Software Engineer",
      dateRange: "July 2022 - Present",
      location: "Hamburg, Germany",
      certificate: "https://files.selleazyy.com/employment_certificate_KN.pdf",
      bullets: [
        "Spearheaded the end-to-end migration of a legacy pharmaceutical monitoring system to a unified web dashboard, replacing manual Excel workflows and significantly reducing monitoring gaps for high-value cargo.",
        'Engineered a full-stack, event-driven architecture using Spring Boot, Kafka, and Angular to process high-velocity shipment data, providing 24/7 real-time tracking and streamlined workflows for the "Air Logistics" module.',
        "Architected modular components for future global expansion into Sea and Road logistics while improving current operational efficiency, enabling operators to manage shipments end-to-end within the new software.",
      ],
    },
    {
      company: "Method Park by UL",
      title: "Software Engineer",
      dateRange: "August 2019 - July 2022",
      location: "Erlangen, Germany",
      bullets: [
        "Developed an AI-integrated web platform using Angular to assist orthopedic surgeons in analyzing X-ray reports.",
        "Reduced diagnostic analysis time by implementing features that allowed doctors to highlight and annotate specific report sections based on AI-driven anomaly detection.",
        "Enhanced clinical decision-making by building a system that flags missed details in reports, ensuring higher accuracy in post-operative recovery monitoring.",
      ],
    },
    {
      company: "InfancyIT",
      title: "Software Engineer",
      dateRange: "October 2017 - April 2019",
      location: "Sylhet, Bangladesh",
      bullets: [
        "Translated complex stakeholder requirements into actionable technical roadmaps for a high-traffic food delivery platform, aligning business objectives with engineering execution to ensure consistent delivery of high-priority milestones.",
        "Engineered a scalable REST API infrastructure capable of sustaining 10,000+ daily requests, prioritizing system reliability and low-latency performance during periods of rapid user acquisition.",
        "Orchestrated the simultaneous development of dual full-stack projects—leveraging Laravel/Vue.js and Express.js/React.js ecosystems—balancing divergent feature priorities while maintaining rigorous architectural integrity and code quality.",
        "Partnered with a five-person engineering team to deploy critical system optimizations, directly contributing to a 20% increase in annual revenue by enhancing platform efficiency and user conversion rates.",
      ],
    },
    {
      company: "Vivacom solutions ltd",
      title: "Software Engineer",
      dateRange: "October 2016 – September 2017",
      location: "Dhaka, Bangladesh",
      bullets: [
        "Architected and deployed a mission-critical Content Management System (CMS) for a leading telecommunications provider in Somalia, facilitating high-availability content delivery for a subscriber base of several million users.",
        "Engineered a decoupled microservices ecosystem using Spring Boot for a mobile banking platform, enabling independent service scalability and significantly reducing deployment lead times through optimized CI/CD workflows.",
        "Standardized the development lifecycle by implementing Docker containerization across multiple internal projects, ensuring environment parity and streamlining cross-functional collaboration between engineering teams.",
        "Collaborated within a high-performance team of five engineers to deliver secure, modular financial software, prioritizing clean-code architecture and future-proof design patterns to ensure long-term system maintainability.",
      ],
    },
  ],
  education: [
    {
      school: "Otto-Friedrich-Universität Bamberg",
      degree: "Master's degree - M.Sc. Software System Science",
      dateRange: "April 2019 - June 2022",
      achievements: [],
    },
    {
      school: "Shahjalal University of Science and Technology",
      degree: "Bachelor of Engineering - Computer Engineering",
      dateRange: "January 2011 - June 2015",
      achievements: [],
    },
  ],
  localPresence: {
    timezone: "Europe/Berlin",
    city: "Bremen",
    availableHours: { start: 9, end: 18 },
  },
  references: [
    {
      name: "Gricel Bernal",
      position:
        "Global Supply Chain & Logistics Leader | Process Transformation | AI Integration | Control Tower | Switzerland",
      linkedin: "https://www.linkedin.com/in/gricel-bernal/",
      highlights: [
        "technical expertise",
        "broader business objectives",
        "bridge business needs and technical execution",
        "knowledgeable, dependable",
      ],
      quote:
        "I worked closely with Yousuf for four years and came to appreciate not only his technical expertise but also his professionalism and collaborative approach. He has a strong ability to understand requirements, ask thoughtful questions, and deliver high-quality solutions that address both immediate needs and broader business objectives. One of the best examples of this was ASTRO, the TMS developed for my team, the HyperCare team. Yousuf was instrumental in turning business requirements into a reliable and effective solution. What stood out was his ability to fully understand what was being asked, seek clarification when needed, and then translate those requirements into well designed functionality. While many developers naturally focus on the technical implementation, Yousuf consistently took the time to understand the business need behind each request. This enabled him to identify dependencies, connections, and opportunities to enhance the solution in ways that added real value for users. ASTRO became an important part of our daily operations, and I believe much of its success comes from his ability to bridge business needs and technical execution, resulting in a solution that was truly fit for purpose. Yousuf is knowledgeable, dependable, and generous with his time and expertise, always willing to support colleagues and contribute to the success of the team. Just as importantly, he is approachable, respectful, and easy to work with. He combines technical skill with sound judgment and a genuine interest in understanding how technology can best support the people who use it. Working with him over the years has been a rewarding experience, and I have always valued his contributions, insights, and collaborative approach.",
    },
    {
      name: "João Victor Nobrega",
      position: "Team Lead | Tech Lead | Senior Software Engineer",
      linkedin: "https://www.linkedin.com/in/jv-nobrega/",
      highlights: [
        "problem-solving skills",
        "balance technical excellence with business needs",
        "ownership, productivity, and team-first attitude",
      ],
      quote:
        "I had the opportunity to work closely with Yousuf for nearly two years at Kuehne+Nagel, and I can honestly say he is one of the most reliable and capable engineers I have worked with. He has a strong technical foundation, excellent problem-solving skills, and a natural ability to balance technical excellence with business needs. Yousuf consistently brings critical thinking to discussions, asks the right questions, and focuses on delivering practical, high-quality solutions. What stands out most is his ownership, productivity, and team-first attitude. He is always willing to help others, share knowledge, and contribute to a positive working environment. His professionalism, collaboration skills, and commitment to delivering results make him someone every team would be fortunate to have. I highly recommend Yousuf and would be happy to work with him again in the future.",
    },
    {
      name: "Daiany Palacios",
      position: "Senior Platform Product Manager",
      linkedin: "https://www.linkedin.com/in/daiany-palacios/",
      highlights: [
        "complex technical challenges",
        "speed, quality, maintainability, and scalability",
        "practical solutions that match real business needs",
        "empathetic, reliable, respectful",
      ],
      quote:
        "Yousuf is an excellent software engineer with strong skills across frontend, backend, infrastructure as code, CI/CD, and software delivery. He is able to take on complex technical challenges while keeping a strong balance between speed, quality, maintainability, and scalability. He thrives in problem-solving, quickly understands the bigger picture, and helps teams find practical solutions that match real business needs. Beyond his technical strengths, Yousuf is empathetic, reliable, respectful, and trusted by his team. He communicates well, supports collaboration between technical and business stakeholders, and consistently delivers on his commitments.",
    },
    {
      name: "Christian Lederer",
      position: "Head of Medical Applications",
      linkedin: "https://www.linkedin.com/in/christian-lederer-65a6a8192/",
      highlights: [
        "broad background in web technologies",
        "great plus for any development team",
        "hire him again",
      ],
      quote:
        "Yousuf is an exceptionally clever and intelligent hard-working guy with a broad background in web technologies, He's thankful and non-demanding, He is a great plus for any development team. I am thankful for the time I could spend with him and I'd hire him again any time.",
    },
  ],
};
