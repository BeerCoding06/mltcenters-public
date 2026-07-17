import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Lang = 'en' | 'th';

export const translations = {
  nav: {
    home: { en: "Home", th: "หน้าแรก" },
    about: { en: "About", th: "เกี่ยวกับเรา" },
    activities: { en: "Activities", th: "กิจกรรม" },
    schedule: { en: "Schedule", th: "กำหนดการ" },
    gallery: { en: "Gallery", th: "แกลเลอรี" },
    register: { en: "Register", th: "ลงทะเบียน" },
    contact: { en: "Contact", th: "ติดต่อ" },
    assessment: { en: "Chat English", th: "คุยภาษาอังกฤษ" },
    runner: { en: "3D Runner Game", th: "เกมวิ่ง 3D" },
  },
  assessmentPage: {
    title: { en: "Chat in English", th: "คุยภาษาอังกฤษ" },
    subtitle: {
      en: "English only — simple words, slow voice. Speak clearly.",
      th: "ภาษาอังกฤษอย่างเดียว คำง่าย พูดช้า ชัด ๆ",
    },
    startVoice: { en: "Start talking", th: "เริ่มคุย" },
    startHint: {
      en: "Tap to listen — speak slowly. The AI will wait for you.",
      th: "แตะเพื่อฟัง AI แล้วพูดช้า ๆ ชัด ๆ — ระบบจะรอให้พูดจบ",
    },
    points: { en: "Points", th: "คะแนน" },
    done: { en: "I'm done — show my results", th: "จบแล้ว — ดูผลประเมิน" },
    status: {
      idle: { en: "Ready to chat", th: "พร้อมคุย" },
      listening: { en: "Listening… speak slowly", th: "กำลังฟัง… พูดช้า ๆ ได้เลย" },
      thinking: { en: "Thinking…", th: "กำลังคิด…" },
      speaking: { en: "AI is speaking…", th: "AI กำลังพูด…" },
    },
    chat: {
      placeholder: { en: "Speak slowly or type…", th: "พูดช้า ๆ หรือพิมพ์…" },
      send: { en: "Send", th: "ส่ง" },
      micOn: { en: "Stop microphone", th: "หยุดไมค์" },
      micOff: { en: "Start microphone", th: "เปิดไมค์" },
      replay: { en: "Hear again", th: "ฟังอีกครั้ง" },
      you: { en: "You", th: "คุณ" },
      ai: { en: "AI Tutor", th: "AI ติวเตอร์" },
      voiceMode: { en: "Voice conversation on", th: "โหมดคุยด้วยเสียงเปิดอยู่" },
      typeMode: { en: "Type to reply", th: "พิมพ์เพื่อตอบ" },
    },
    scenarios: {
      title: { en: "Choose a situation", th: "เลือกสถานการณ์จำลอง" },
      hint: { en: "Pick a scene, then tap Start talking.", th: "เลือกฉากก่อน แล้วกดเริ่มคุย" },
      free_talk: { en: "Free talk", th: "คุยสบาย ๆ" },
      school: { en: "At school", th: "ที่โรงเรียน" },
      restaurant: { en: "Restaurant", th: "ร้านอาหาร" },
      park: { en: "At the park", th: "ที่สวนสาธารณะ" },
      shopping: { en: "Shopping", th: "ซื้อของ" },
      home: { en: "At home", th: "อยู่บ้าน" },
      making_friends: { en: "Making friends", th: "หาเพื่อนใหม่" },
      doctor: { en: "Doctor visit", th: "ไปหาหมอ" },
      hotel_booking: { en: "Hotel booking", th: "จองที่พัก" },
      getting_lost: { en: "Getting lost", th: "หลงทาง" },
      asking_directions: { en: "Giving directions", th: "มีคนถามทาง" },
    },
  },
  hero: {
    headline: {
      en: "Learn Languages Through Technology",
      th: "เรียนภาษาผ่านเทคโนโลยีอย่างสนุกและทันสมัย",
    },
    sub: {
      en: "Interactive AI-powered workshops",
      th: "ฝึกจริง ใช้ AI จริง พัฒนาทักษะแห่งอนาคต",
    },
    cta: { en: "Join Now", th: "สมัครเข้าร่วม" },
  },
  problemSolution: {
    title: { en: "Sound Familiar?", th: "เคยรู้สึกแบบนี้ไหม?" },
    items: [
      {
        problem: { en: "Not confident speaking", th: "ไม่มั่นใจพูด" },
        solution: {
          en: "AI conversation practice in a safe space",
          th: "ฝึกสนทนากับ AI ในบรรยากาศที่เป็นกันเอง",
        },
        icon: "🎤",
      },
      {
        problem: { en: "Memorizing but not using", th: "ท่องจำแต่ใช้ไม่ได้" },
        solution: {
          en: "Real hands-on activities",
          th: "ลงมือทำจริงในกิจกรรม",
        },
        icon: "✨",
      },
      {
        problem: { en: "Unsure how to use AI", th: "ใช้ AI ไม่เป็น" },
        solution: {
          en: "Learn with real AI tools",
          th: "เรียนรู้ผ่านเครื่องมือ AI จริง",
        },
        icon: "🤖",
      },
      {
        problem: { en: "Learning alone is boring", th: "เรียนคนเดียวเบื่อ" },
        solution: { en: "Fun team learning", th: "สนุกกับเพื่อนในทีม" },
        icon: "👥",
      },
    ],
  },
  activitiesPreview: {
    title: { en: "What You’ll Do", th: "กิจกรรมในเวิร์กช็อป" },
    items: [
      {
        icon: "🤖",
        title: { en: "AI Conversation", th: "สนทนากับ AI" },
        short: { en: "Practice with AI partners", th: "ฝึกกับ AI" },
      },
      {
        icon: "📱",
        title: { en: "Language Apps", th: "แอปเรียนภาษา" },
        short: { en: "Try the best apps", th: "ลองแอปชั้นนำ" },
      },
      {
        icon: "🎮",
        title: { en: "Team Games", th: "เกมภาษา" },
        short: { en: "Compete with friends", th: "แข่งกับเพื่อน" },
      },
      {
        icon: "🎬",
        title: { en: "Digital Presentation", th: "นำเสนอดิจิทัล" },
        short: { en: "Present with confidence", th: "นำเสนออย่างมั่นใจ" },
      },
    ],
  },
  galleryPreview: {
    title: { en: "Workshop Moments", th: "บรรยากาศในงาน" },
    viewAll: { en: "View full gallery", th: "ดูแกลเลอรีทั้งหมด" },
  },
  benefits: {
    title: { en: "What You’ll Gain", th: "สิ่งที่คุณจะได้" },
    items: [
      { en: "Speak with confidence", th: "พูดมั่นใจขึ้น" },
      { en: "Use AI effectively", th: "ใช้ AI เป็นจริง" },
      { en: "Think critically", th: "คิดวิเคราะห์ดีขึ้น" },
      { en: "Improve teamwork", th: "ทำงานทีมได้ดี" },
    ],
  },
  homeContact: {
    title: { en: "Get in Touch", th: "ติดต่อเรา" },
    sub: {
      en: "Scan our LINE QR or reach us through any channel below.",
      th: "สแกน QR LINE เพื่อติดต่อทันที หรือเลือกช่องทางอื่นด้านล่าง",
    },
    scanLine: {
      en: "Scan LINE QR to inquire about English workshops and registration",
      th: "สแกน QR LINE สอบถามเวิร์กช็อปภาษาอังกฤษและลงทะเบียน",
    },
    lineLive: { en: "LINE Official QR", th: "QR LINE ทางการ" },
    lineHint: {
      en: "Fast replies for workshop & registration inquiries",
      th: "ตอบไว สอบถามเวิร์กช็อปและลงทะเบียนได้เลย",
    },
    orContact: { en: "Other channels", th: "ช่องทางอื่นๆ" },
    viewContact: { en: "View contact page", th: "ดูหน้าติดต่อทั้งหมด" },
    register: { en: "Register online", th: "ลงทะเบียนออนไลน์" },
  },
  testimonials: {
    title: { en: "What Students Say", th: "เสียงจากผู้เข้าร่วม" },
    items: [
      {
        quote: {
          en: "The AI practice was so helpful. I finally dared to speak!",
          th: "การฝึกกับ AI ช่วยได้มาก ในที่สุดก็กล้าพูดแล้ว!",
        },
        name: { en: "Mint", th: "มิ้นท์" },
        role: { en: "Grade 11", th: "ม.5" },
      },
      {
        quote: {
          en: "Fun and useful. I learned more in one day than in months.",
          th: "ทั้งสนุกและได้ใช้จริง เรียนวันเดียวได้มากกว่าหลายเดือน",
        },
        name: { en: "Job", th: "จ็อบ" },
        role: { en: "Year 2", th: "ปี 2" },
      },
      {
        quote: {
          en: "Best workshop for language + tech. Highly recommend!",
          th: "เวิร์กช็อปภาษากับเทคโนโลยีที่ดีที่สุด แนะนำมาก!",
        },
        name: { en: "Ploy", th: "พลอย" },
        role: { en: "Year 3", th: "ปี 3" },
      },
    ],
  },
  finalCta: {
    heading: {
      en: "Ready to Upgrade Your Future?",
      th: "พร้อมพัฒนาทักษะแห่งอนาคตแล้วหรือยัง?",
    },
    btn: { en: "Join Now", th: "สมัครเข้าร่วม" },
  },
  aboutValue: {
    title: { en: "Why This Workshop", th: "ทำไมต้องเวิร์กช็อปนี้" },
    sub: { en: "Three reasons to join", th: "สามเหตุผลที่ควรร่วมเวิร์กช็อป" },
    items: [
      {
        title: { en: "Learn with AI", th: "เรียนรู้ด้วย AI" },
        desc: {
          en: "Practice with real AI tools in a supportive environment.",
          th: "ฝึกกับเครื่องมือ AI จริงในบรรยากาศที่เป็นกันเอง",
        },
        alt: {
          en: "Students learning English with laptops and digital tools in an MLTCENTERS classroom",
          th: "นักเรียนเรียนภาษาอังกฤษด้วยแล็ปท็อปและเครื่องมือดิจิทัลในชั้นเรียน MLTCENTERS",
        },
      },
      {
        title: { en: "Hands-on practice", th: "ลงมือทำจริง" },
        desc: {
          en: "No boring lectures — learn by doing.",
          th: "ไม่มีแค่บรรยาย เรียนรู้จากการลงมือทำ",
        },
        alt: {
          en: "Hands-on English activity — students arranging word cards to build sentences together",
          th: "กิจกรรมภาษาอังกฤษแบบลงมือทำ — นักเรียนจัดคำศัพท์สร้างประโยคร่วมกัน",
        },
      },
      {
        title: { en: "Future-ready skills", th: "พัฒนาทักษะแห่งอนาคต" },
        desc: {
          en: "Build skills that matter for tomorrow.",
          th: "พัฒนาทักษะที่สำคัญสำหรับอนาคต",
        },
        alt: {
          en: "English presentation practice — instructor guiding students to speak with confidence",
          th: "ฝึกนำเสนอภาษาอังกฤษ — ครูแนะนำนักเรียนให้พูดอย่างมั่นใจ",
        },
      },
    ],
  },
  highlights: {
    title: { en: "What You'll Experience", th: "สิ่งที่คุณจะได้เรียนรู้" },
    items: [
      {
        icon: "🤖",
        title: { en: "AI Chatbot Practice", th: "ฝึกกับ AI Chatbot" },
        desc: {
          en: "Practice conversations with AI-powered language partners.",
          th: "ฝึกสนทนากับ AI ที่ช่วยพัฒนาภาษา",
        },
      },
      {
        icon: "🎮",
        title: { en: "Language Games", th: "เกมภาษาสนุกๆ" },
        desc: {
          en: "Learn through fun team-based language games.",
          th: "เรียนรู้ผ่านเกมภาษาเป็นทีม",
        },
      },
      {
        icon: "📱",
        title: { en: "Digital Tools", th: "เครื่องมือดิจิทัล" },
        desc: {
          en: "Hands-on with the latest language learning apps.",
          th: "ลงมือใช้แอปเรียนภาษาล่าสุด",
        },
      },
      {
        icon: "🎤",
        title: { en: "Present & Shine", th: "นำเสนออย่างมั่นใจ" },
        desc: {
          en: "Build confidence presenting in multiple languages.",
          th: "สร้างความมั่นใจในการนำเสนอหลายภาษา ",
        },
      },
    ],
  },
  homeCta: {
    title: {
      en: "Ready to Start Your Journey?",
      th: "พร้อมเริ่มต้นการเดินทางหรือยัง?",
    },
    sub: {
      en: "Join hundreds of students learning languages with technology",
      th: "เข้าร่วมกับนักเรียนหลายร้อยคนที่เรียนภาษาด้วยเทคโนโลยี",
    },
    btn: { en: "Register Now", th: "ลงทะเบียนเลย" },
  },
  whyJoin: {
    title: { en: "Why Join This Workshop", th: "ทำไมต้องร่วมเวิร์กช็อปนี้" },
    items: [
      {
        icon: "🎤",
        title: {
          en: "Boost Your Speaking Confidence",
          th: "เพิ่มความมั่นใจในการพูด",
        },
        desc: {
          en: "Practice in a safe, supportive environment with peers and AI.",
          th: "ฝึกพูดในบรรยากาศที่เป็นกันเอง ร่วมกับเพื่อนและ AI",
        },
      },
      {
        icon: "🤖",
        title: { en: "Learn with AI Tools", th: "เรียนรู้ผ่าน AI" },
        desc: {
          en: "Use cutting-edge AI to level up your language skills.",
          th: "ใช้ AI ล้ำสมัยพัฒนาทักษะภาษาของคุณ",
        },
      },
      {
        icon: "✨",
        title: { en: "Hands-on Activities", th: "ลงมือปฏิบัติจริง" },
        desc: {
          en: "Learn by doing — no boring lectures, just real practice.",
          th: "เรียนรู้จากการลงมือทำ ไม่มีแค่บรรยาย มีแต่ปฏิบัติจริง",
        },
      },
      {
        icon: "👥",
        title: { en: "Fun Team Experience", th: "สนุกกับกิจกรรมกลุ่ม" },
        desc: {
          en: "Make friends and learn together in a fun, collaborative way.",
          th: "ได้เพื่อนใหม่และเรียนรู้ไปด้วยกันอย่างสนุก",
        },
      },
    ],
  },
  experiencePreview: {
    title: { en: "A Taste of What Awaits", th: "ลิ้มรสประสบการณ์ที่รอคุณอยู่" },
    sub: {
      en: "Interactive sessions, real tools, and lasting skills — all in one day.",
      th: "กิจกรรมเชิงปฏิบัติ เครื่องมือจริง และทักษะที่ติดตัว — ในวันเดียว",
    },
    cta: { en: "Reserve Your Spot Now", th: "จองที่นั่งของคุณตอนนี้" },
  },
  emotionalCta: {
    heading: {
      en: "Your Future Skills Start Today",
      th: "ทักษะแห่งอนาคต เริ่มต้นวันนี้",
    },
    sub: {
      en: "Join the workshop and take the first step.",
      th: "มาร่วมเวิร์กช็อปและก้าวแรกไปด้วยกัน",
    },
    btn: { en: "Register Now", th: "ลงทะเบียนเลย" },
  },
  about: {
    title: { en: "About the Workshop", th: "เกี่ยวกับกิจกรรม" },
    desc: {
      en: "This workshop blends language learning with modern technology tools for real-world skills. Students will explore AI chatbots, language apps, team games, and digital presentation — all in a fun, interactive environment.",
      th: "กิจกรรมนี้ผสานการเรียนรู้ภาษากับเทคโนโลยีสมัยใหม่ เพื่อพัฒนาทักษะที่ใช้ได้จริง นักเรียนจะได้สำรวจ AI Chatbot แอปเรียนภาษา เกมทีม และการนำเสนอดิจิทัล ในบรรยากาศที่สนุกสนาน",
    },
    benefits: {
      title: { en: "Why This Workshop?", th: "ทำไมต้องกิจกรรมนี้?" },
      items: [
        {
          icon: "💡",
          title: { en: "Learn by Doing", th: "เรียนรู้จากการลงมือทำ" },
          desc: {
            en: "Hands-on, project-based activities.",
            th: "กิจกรรมเชิงปฏิบัติการ เรียนรู้ผ่านโปรเจกต์จริง",
          },
        },
        {
          icon: "🌐",
          title: { en: "Real-World Tech", th: "เทคโนโลยีจริง" },
          desc: {
            en: "Use the same tools professionals use.",
            th: "ใช้เครื่องมือเดียวกับมืออาชีพ",
          },
        },
        {
          icon: "👥",
          title: { en: "Teamwork Skills", th: "ทักษะการทำงานเป็นทีม" },
          desc: {
            en: "Collaborate and learn from peers.",
            th: "ทำงานร่วมกันและเรียนรู้จากเพื่อน",
          },
        },
        {
          icon: "🏆",
          title: { en: "Certificates", th: "ใบประกาศนียบัตร" },
          desc: {
            en: "Earn a certificate of participation.",
            th: "รับใบประกาศนียบัตรหลังจบกิจกรรม",
          },
        },
      ],
    },
  },
  activities: {
    title: { en: "Workshop Activities", th: "กิจกรรมในงาน" },
    learnMore: { en: "Learn More", th: "ดูรายละเอียด" },
    items: [
      {
        icon: "🤖",
        title: { en: "AI Conversation Practice", th: "ฝึกสนทนาด้วย AI" },
        desc: {
          en: "Practice real conversations with AI partners that adapt to your level.",
          th: "ฝึกสนทนาจริงกับ AI ที่ปรับระดับตามความสามารถของคุณ",
        },
        color: "primary",
      },
      {
        icon: "📲",
        title: { en: "Language Apps Workshop", th: "ฝึกใช้แอปเรียนภาษา" },
        desc: {
          en: "Explore the best language learning apps and how to use them effectively.",
          th: "สำรวจแอปเรียนภาษาที่ดีที่สุดและวิธีใช้อย่างมีประสิทธิภาพ",
        },
        color: "secondary",
      },
      {
        icon: "🎯",
        title: { en: "Team Language Games", th: "เกมภาษาแบบทีม" },
        desc: {
          en: "Compete in fun team-based language challenges and quizzes.",
          th: "แข่งขันเกมภาษาเป็นทีมสุดสนุก ทั้งท้าทายและควิซ",
        },
        color: "accent",
      },
      {
        icon: "🎬",
        title: {
          en: "Digital Presentation Skills",
          th: "พรีเซนต์ด้วยเทคโนโลยี",
        },
        desc: {
          en: "Learn to create and deliver stunning digital presentations.",
          th: "เรียนรู้การสร้างและนำเสนอผลงานดิจิทัลอย่างน่าสนใจ",
        },
        color: "highlight",
      },
    ],
  },
  schedule: {
    title: { en: "Program Schedule", th: "กำหนดการ" },
    sub: {
      en: "Two signature programs from MLTCENTERS — learn languages through real experiences, at home and abroad.",
      th: "สองโปรแกรมหลักของ MLTCENTERS — เรียนรู้ภาษาจากประสบการณ์จริง ทั้งในและต่างประเทศ",
    },
    travel: {
      badge: { en: "International Tours", th: "ท่องเที่ยวต่างประเทศ" },
      intro: {
        en: "Study-travel programs that combine sightseeing with daily English missions — speak, explore, and grow confident abroad.",
        th: "โปรแกรมทัศนศึกษาผสานการท่องเที่ยวกับภารกิจใช้ภาษาอังกฤษทุกวัน — ได้เที่ยว ได้ฝึกพูด ได้สร้างความมั่นใจในต่างแดน",
      },
      programs: [
        {
          period: { en: "Jul – Aug 2026", th: "ก.ค. – ส.ค. 2569" },
          title: { en: "Singapore · Malaysia Language Journey", th: "ทริปสิงคโปร์ · มาเลเซีย เรียนรู้ผ่านการเดินทาง" },
          destination: { en: "Singapore · Kuala Lumpur", th: "สิงคโปร์ · มาเลเซีย" },
          desc: {
            en: "5 days — airport & hotel English, city missions, night market conversations, and a final group presentation.",
            th: "5 วัน — ภาษาอังกฤษที่สนามบินและโรงแรม ภารกิจในเมือง สนทนาในตลาดกลางคืน และนำเสนอผลงานปิดท้าย",
          },
        },
        {
          period: { en: "Oct 2026", th: "ต.ค. 2569" },
          title: { en: "Japan Culture & Communication Tour", th: "ทัวร์ญี่ปุ่น วัฒนธรรมและการสื่อสาร" },
          destination: { en: "Tokyo · Osaka", th: "โตเกียว · โอซาก้า" },
          desc: {
            en: "6 days — train travel phrases, shrine visits, team challenges, and confidence-building photo-story projects.",
            th: "6 วัน — ประโยคใช้บนรถไฟ เที่ยววัดศาลเจ้า กิจกรรมทีม และโปรเจกต์เล่าเรื่องด้วยภาพเพื่อสร้างความมั่นใจ",
          },
        },
        {
          period: { en: "Dec 2026 – Jan 2027", th: "ธ.ค. 2569 – ม.ค. 2570" },
          title: { en: "Winter English Camp Abroad", th: "ค่ายภาษาอังกฤษฤดูหนาว ต่างประเทศ" },
          destination: { en: "Seoul · Busan", th: "โซล · Busan" },
          desc: {
            en: "7 days — K-culture immersion, shopping & café dialogues, and a farewell showcase with certificates.",
            th: "7 วัน — แชร์วัฒนธรรมเกาหลี สนทนาในห้างและคาเฟ่ และงาน Showcase ปิดท้ายพร้อมเกียรติบัตร",
          },
        },
      ],
      tripOutline: {
        title: { en: "Typical trip flow", th: "ลำดับกิจกรรมโดยทั่วไป" },
        days: [
          {
            label: { en: "Day 1", th: "วัน 1" },
            desc: {
              en: "Briefing, airport English, hotel check-in & orientation walk",
              th: "ปฐมนิเทศ ภาษาอังกฤษที่สนามบิน เช็คอินโรงแรม และเดินทำความรู้จักพื้นที่",
            },
          },
          {
            label: { en: "Day 2–3", th: "วัน 2–3" },
            desc: {
              en: "City missions, market conversations & team language games",
              th: "ภารกิจในเมือง สนทนาในตลาด และเกมภาษาแบบทีม",
            },
          },
          {
            label: { en: "Day 4–5", th: "วัน 4–5" },
            desc: {
              en: "Cultural visits, free exploration tasks & group presentation",
              th: "เที่ยววัฒนธรรม ภารกิจสำรวจอิสระ และนำเสนอผลงานกลุ่ม",
            },
          },
          {
            label: { en: "Final day", th: "วันสุดท้าย" },
            desc: {
              en: "Reflection, certificates & departure",
              th: "สรุปบทเรียน มอบเกียรติบัตร และเดินทางกลับ",
            },
          },
        ],
      },
    },
    hotel: {
      badge: { en: "Hotel Confidence Workshop", th: "Workshop โรงแรม Boost ความมั่นใจ" },
      intro: {
        en: "One-day workshops at partner hotels — practice real hospitality English in elegant settings and leave speaking with confidence.",
        th: "เวิร์กช็อป 1 วัน ณ โรงแรมพันธมิตร — ฝึกภาษาอังกฤษสถานการณ์จริงในบรรยากาศโรงแรม ออกไปด้วยความมั่นใจในการพูด",
      },
      recurring: {
        en: "Every last Saturday of the month · 09:00 – 16:30",
        th: "ทุกวันเสาร์สุดท้ายของเดือน · 09:00 – 16:30 น.",
      },
      venue: {
        en: "Partner hotels in Bangkok & Samut Prakan (venue announced before each session)",
        th: "โรงแรมพันธมิตร กรุงเทพฯ และสมุทรปราการ (ประกาศสถานที่ก่อนแต่ละรอบ)",
      },
      sessions: [
        {
          period: { en: "Mar 2026", th: "มี.ค. 2569" },
          title: { en: "Front Desk & Guest Welcome", th: "ต้อนรับแขก & Front Desk" },
          desc: {
            en: "Role-play check-in, handling requests, and polite small talk in the lobby.",
            th: "สวมบทบาทเช็คอิน ตอบคำขอแขก และ Small talk สุภาพในล็อบบี้โรงแรม",
          },
        },
        {
          period: { en: "Apr 2026", th: "เม.ย. 2569" },
          title: { en: "Restaurant & Banquet English", th: "ภาษาอังกฤษร้านอาหาร & ห้องจัดเลี้ยง" },
          desc: {
            en: "Menu vocabulary, recommending dishes, and presenting at a banquet table.",
            th: "คำศัพท์เมนู แนะนำอาหาร และนำเสนอในห้องจัดเลี้ยง",
          },
        },
        {
          period: { en: "May 2026", th: "พ.ค. 2569" },
          title: { en: "Meetings & Presentation Confidence", th: "ประชุม & ความมั่นใจในการนำเสนอ" },
          desc: {
            en: "Hotel meeting-room scenarios, slide-free pitching, and feedback circles.",
            th: "สถานการณ์ในห้องประชุมโรงแรม Pitch โดยไม่พึ่งสไลด์ และวง Feedback",
          },
        },
      ],
      dayPlan: [
        {
          time: "09:00",
          title: { en: "Welcome at the Hotel", th: "ต้อนรับ ณ โรงแรม" },
          desc: {
            en: "Registration, ice breaking & confidence warm-up in the lobby lounge.",
            th: "ลงทะเบียน กิจกรรมทำความรู้จัก และ Warm-up สร้างความมั่นใจ",
          },
        },
        {
          time: "10:00",
          title: { en: "Real Hotel Role-Play", th: "Role-play สถานการณ์โรงแรม" },
          desc: {
            en: "Check-in, concierge, and guest-service dialogues with coaches.",
            th: "สนทนาเช็คอิน Concierge และบริการแขก กับ Coach ประจำรอบ",
          },
        },
        {
          time: "12:00",
          title: { en: "Lunch & Networking", th: "อาหารกลางวัน & Networking" },
          desc: {
            en: "Practice ordering and casual English over lunch at the hotel restaurant.",
            th: "ฝึกสั่งอาหารและคุยภาษาอังกฤษแบบเป็นกันเอง มื้อกลางวันที่ร้านโรงแรม",
          },
        },
        {
          time: "13:30",
          title: { en: "Confidence Boost Lab", th: "Confidence Boost Lab" },
          desc: {
            en: "Voice, posture, eye contact & handling nervous moments.",
            th: "เสียง ท่าทาง สบตา และจัดการความประหม่า",
          },
        },
        {
          time: "15:00",
          title: { en: "Mini Showcase", th: "Mini Showcase" },
          desc: {
            en: "Short presentations in front of peers — celebrate progress together.",
            th: "นำเสนอสั้นๆ ต่อหน้าเพื่อนๆ — ฉลองความก้าวหน้าร่วมกัน",
          },
        },
        {
          time: "16:30",
          title: { en: "Closing & Certificate", th: "ปิดงาน & เกียรติบัตร" },
          desc: {
            en: "Group photo, feedback, and certificate ceremony in the function room.",
            th: "ถ่ายรูปหมู่ รับ Feedback และมอบเกียรติบัตรในห้อง Function",
          },
        },
      ],
    },
    note: {
      en: "Dates and venues may be updated. Contact us or scan LINE QR for the latest schedule and seat availability.",
      th: "วันและสถานที่อาจมีการปรับเปลี่ยน ติดต่อเราหรือสแกน LINE QR เพื่อดูกำหนดการและที่นั่งล่าสุด",
    },
    ctaRegister: { en: "Register now", th: "ลงทะเบียน" },
    ctaContact: { en: "Ask about schedule", th: "สอบถามกำหนดการ" },
  },
  gallery: {
    title: { en: "Gallery", th: "แกลเลอรี" },
    sub: { en: "Moments from our workshops", th: "ภาพบรรยากาศจากกิจกรรม" },
    prev: { en: "Previous", th: "ก่อนหน้า" },
    next: { en: "Next", th: "ถัดไป" },
    pageInfo: { en: "Page {page} of {total}", th: "หน้า {page} จาก {total}" },
  },
  registerPage: {
    title: { en: "Register", th: "ลงทะเบียน" },
    cta: {
      en: "Ready to Upgrade Your Skills?",
      th: "พร้อมพัฒนาทักษะของคุณแล้วหรือยัง?",
    },
    firstName: { en: "First Name", th: "ชื่อ" },
    lastName: { en: "Last Name", th: "นามสกุล" },
    nickname: { en: "Nickname", th: "ชื่อเล่น" },
    company: { en: "Company", th: "บริษัท / องค์กร" },
    position: { en: "Position", th: "ตำแหน่ง" },
    educationLevel: { en: "Education Level", th: "ระดับการศึกษา" },
    phone: { en: "Phone", th: "เบอร์โทรศัพท์" },
    lineId: { en: "Line ID", th: "Line ID" },
    email: { en: "Email", th: "อีเมล" },
    submit: { en: "Submit Registration", th: "ลงทะเบียน" },
    submitting: { en: "Submitting…", th: "กำลังส่ง…" },
    success: { en: "Registration submitted! We will contact you soon.", th: "ลงทะเบียนสำเร็จ! เราจะติดต่อกลับโดยเร็ว" },
    error: { en: "Could not submit registration. Please try again.", th: "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" },
    educationOptions: [
      { en: "High School", th: "มัธยมศึกษา" },
      { en: "Vocational / Diploma", th: "ประกาศนียบัตรวิชาชีพ / อนุปริญญา" },
      { en: "Bachelor's Degree", th: "ปริญญาตรี" },
      { en: "Master's Degree", th: "ปริญญาโท" },
      { en: "Doctorate", th: "ปริญญาเอก" },
      { en: "Other", th: "อื่นๆ" },
    ],
  },
  contactPage: {
    title: { en: "Contact Us", th: "ติดต่อเรา" },
    sub: {
      en: "Reach MLTCENTERS — we're happy to help with workshops and registration.",
      th: "ติดต่อ MLTCENTERS ได้ทุกช่องทาง ยินดีให้คำปรึกษาเรื่องเวิร์กช็อปและการลงทะเบียน",
    },
    posterAlt: {
      en: "MLTCENTERS poster — Modern Language Training Center for English and language learning",
      th: "โปสเตอร์ MLTCENTERS — ศูนย์ฝึกอบรมภาษาสมัยใหม่ เรียนภาษาอังกฤษและภาษาอื่นๆ",
    },
    posterCaption: {
      en: "Modern Language Training Center",
      th: "ศูนย์ฝึกอบรมภาษาสมัยใหม่",
    },
    email: "mltcenterth@gmail.com",
    phone: "094-852-1188",
    address: {
      en: "157/160-161 Moo.9 Teparuk KM.18 Bangpla, Bangpli, Samutprakan 10540",
      th: "157/160-161 หมู่ที่ 9 เทพารักษ์ กม.18 ต.บางพลา อ.บางพลี จ.สมุทรปราการ 10540",
    },
    social: { en: "Follow Us", th: "ติดตามเรา" },
    mapTitle: { en: "Find Us", th: "แผนที่" },
    mapUrl: "https://goo.gl/maps/FkR7BQL2cycZTmiy6?g_st=al",
    openInMaps: { en: "Open in Google Maps", th: "เปิดใน Google Maps" },
  },
  imageAlt: {
    brandLogo: {
      en: "MLTCENTERS logo — modern English language learning and technology workshop",
      th: "โลโก้ MLTCENTERS — เวิร์กช็อปเรียนภาษาอังกฤษและเทคโนโลยีสมัยใหม่",
    },
    hero: {
      en: "Students learning English through AI tools and interactive technology at MLTCENTERS workshop",
      th: "นักเรียนเรียนภาษาอังกฤษด้วย AI และเทคโนโลยีในเวิร์กช็อป MLTCENTERS",
    },
    aboutWorkshop: {
      en: "English workshop classroom — students practicing language skills with modern technology",
      th: "ห้องเรียนเวิร์กช็อปภาษาอังกฤษ — นักเรียนฝึกทักษะภาษาด้วยเทคโนโลยีสมัยใหม่",
    },
    krumamClub: {
      en: "Kru Mam — English language teacher and founder of krumam club at MLTCENTERS",
      th: "ครูแมม — ครูสอนภาษาอังกฤษและผู้ก่อตั้ง krumam club ที่ MLTCENTERS",
    },
    krumamClubBanner: {
      en: "Kru Mam Club banner — English language learning community for students overcoming their fear of speaking",
      th: "แบนเนอร์ Kru Mam Club — ชมรมเรียนภาษาอังกฤษสำหรับผู้ที่อยากกล้าพูดภาษาอังกฤษ",
    },
  },
  footer: {
    rights: {
      en: "© 2026 MLTCENTERS Workshop. All rights reserved.",
      th: "© 2026 MLTCENTERS Workshop สงวนลิขสิทธิ์",
    },
    tagline: {
      en: "Learning languages through technology",
      th: "เรียนภาษาผ่านเทคโนโลยี",
    },
  },
} as const;

type Translations = typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem('lang');
      return (stored === 'th' || stored === 'en') ? stored : 'th';
    } catch {
      return 'th';
    }
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch {
      /* ignore quota / private mode */
    }
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translations }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};
