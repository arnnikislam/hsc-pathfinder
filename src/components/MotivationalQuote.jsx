import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Quote, RefreshCw } from 'lucide-react'

const QUOTES = [
  {
    en: "Success is the sum of small efforts repeated day in and day out.",
    bn: "সাফল্য হলো প্রতিদিন ছোট ছোট প্রচেষ্টার সমষ্টি।",
    author: "Robert Collier",
  },
  {
    en: "The secret of getting ahead is getting started.",
    bn: "এগিয়ে যাওয়ার রহস্য হলো শুরু করা।",
    author: "Mark Twain",
  },
  {
    en: "Don't watch the clock; do what it does. Keep going.",
    bn: "ঘড়ির দিকে তাকিও না; ঘড়ি যা করে তাই করো — এগিয়ে যাও।",
    author: "Sam Levenson",
  },
  {
    en: "Education is the most powerful weapon which you can use to change the world.",
    bn: "শিক্ষাই সবচেয়ে শক্তিশালী অস্ত্র যা দিয়ে তুমি পৃথিবী বদলাতে পারো।",
    author: "Nelson Mandela",
  },
  {
    en: "Believe you can and you're halfway there.",
    bn: "বিশ্বাস করো তুমি পারবে — তাহলে তুমি অর্ধেক পথ পার হয়ে গেছো।",
    author: "Theodore Roosevelt",
  },
  {
    en: "It always seems impossible until it's done.",
    bn: "যতক্ষণ না হয়, সবকিছুই অসম্ভব মনে হয়।",
    author: "Nelson Mandela",
  },
  {
    en: "Hard work beats talent when talent doesn't work hard.",
    bn: "পরিশ্রম প্রতিভাকে হারায় যখন প্রতিভা পরিশ্রম করে না।",
    author: "Tim Notke",
  },
  {
    en: "The expert in anything was once a beginner.",
    bn: "যেকোনো বিষয়ের বিশেষজ্ঞও একদিন শিক্ষার্থী ছিল।",
    author: "Helen Hayes",
  },
  {
    en: "Push yourself, because no one else is going to do it for you.",
    bn: "নিজেকে তাগিদ দাও, কারণ অন্য কেউ তোমার হয়ে এটা করবে না।",
    author: "Unknown",
  },
  {
    en: "Great things never come from comfort zones.",
    bn: "আরামদায়ক অবস্থায় থেকে কখনো মহান কিছু অর্জন হয় না।",
    author: "Unknown",
  },
  {
    en: "Dream big, work hard, stay focused and surround yourself with good people.",
    bn: "বড় স্বপ্ন দেখো, কঠোর পরিশ্রম করো, মনোযোগী থাকো।",
    author: "Unknown",
  },
  {
    en: "You don't have to be great to start, but you have to start to be great.",
    bn: "শুরু করতে মহান হতে হয় না, কিন্তু মহান হতে শুরু করতে হয়।",
    author: "Zig Ziglar",
  },
  {
    en: "The future belongs to those who believe in the beauty of their dreams.",
    bn: "ভবিষ্যৎ তাদের, যারা তাদের স্বপ্নের সৌন্দর্যে বিশ্বাস রাখে।",
    author: "Eleanor Roosevelt",
  },
  {
    en: "Discipline is the bridge between goals and accomplishment.",
    bn: "শৃঙ্খলা হলো লক্ষ্য ও সাফল্যের মধ্যে সেতু।",
    author: "Jim Rohn",
  },
  {
    en: "Your only limit is your mind.",
    bn: "তোমার একমাত্র সীমাবদ্ধতা তোমার মন।",
    author: "Unknown",
  },
  {
    en: "Small daily improvements over time lead to stunning results.",
    bn: "প্রতিদিনের ছোট উন্নতি সময়ের সাথে অসাধারণ ফলাফল দেয়।",
    author: "Robin Sharma",
  },
  {
    en: "Study while others are sleeping; work while others are loafing.",
    bn: "যখন অন্যরা ঘুমায় তখন পড়ো; যখন অন্যরা আলসেমি করে তখন কাজ করো।",
    author: "William A. Ward",
  },
  {
    en: "The pain of studying is far less than the pain of regret.",
    bn: "পড়াশোনার কষ্ট অনুশোচনার কষ্টের চেয়ে অনেক কম।",
    author: "Unknown",
  },
  {
    en: "Today's preparation determines tomorrow's achievement.",
    bn: "আজকের প্রস্তুতিই আগামীকালের সাফল্য নির্ধারণ করে।",
    author: "Unknown",
  },
  {
    en: "An investment in knowledge pays the best interest.",
    bn: "জ্ঞানে বিনিয়োগ সর্বোত্তম মুনাফা দেয়।",
    author: "Benjamin Franklin",
  },
  {
    en: "The more that you read, the more things you will know.",
    bn: "যত বেশি পড়বে, তত বেশি জানবে।",
    author: "Dr. Seuss",
  },
  {
    en: "Don't let what you cannot do interfere with what you can do.",
    bn: "যা পারো না তা যেন যা পারো তাকে বাধা না দেয়।",
    author: "John Wooden",
  },
  {
    en: "Success doesn't come from what you do occasionally, it comes from what you do consistently.",
    bn: "সাফল্য মাঝে মাঝে যা করো তা থেকে আসে না, আসে যা নিয়মিত করো তা থেকে।",
    author: "Marie Forleo",
  },
  {
    en: "You are braver than you believe, stronger than you seem, and smarter than you think.",
    bn: "তুমি যতটা ভাবো তার চেয়ে সাহসী, শক্তিশালী এবং বুদ্ধিমান।",
    author: "A.A. Milne",
  },
  {
    en: "HSC is not just an exam — it's a stepping stone to your dreams.",
    bn: "এইচএসসি শুধু একটি পরীক্ষা নয় — এটি তোমার স্বপ্নের সিঁড়ি।",
    author: "HSC PathFinder",
  },
  {
    en: "Every hour you study today is an investment in your future.",
    bn: "আজকের প্রতিটি পড়ার ঘণ্টা তোমার ভবিষ্যতে বিনিয়োগ।",
    author: "HSC PathFinder",
  },
  {
    en: "The student who studies consistently will always outperform the one who studies frantically.",
    bn: "যে শিক্ষার্থী নিয়মিত পড়ে, সে সবসময় যে অনিয়মিত পড়ে তাকে ছাড়িয়ে যায়।",
    author: "HSC PathFinder",
  },
]

// Get a deterministic quote for today (changes daily)
function getTodayQuote() {
  const today     = new Date()
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}

export default function MotivationalQuote() {
  const { i18n } = useTranslation()
  const isBn     = i18n.language === 'bn'

  const [quote,    setQuote]    = useState(getTodayQuote())
  const [idx,      setIdx]      = useState(QUOTES.indexOf(getTodayQuote()))
  const [animating,setAnimating]= useState(false)

  const nextQuote = () => {
    setAnimating(true)
    setTimeout(() => {
      const next = (idx + 1) % QUOTES.length
      setIdx(next)
      setQuote(QUOTES[next])
      setAnimating(false)
    }, 200)
  }

  return (
    <div className="card mb-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-brand-500/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-accent-500/5 rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"/>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Quote size={14} className="text-brand-400"/>
            <span className={`text-xs font-display font-semibold text-white/60 ${isBn?'font-bengali':''}`}>
              {isBn ? 'আজকের অনুপ্রেরণা' : "Today's Motivation"}
            </span>
          </div>
          <button
            onClick={nextQuote}
            className="text-white/20 hover:text-white/60 transition-colors p-1 active:scale-90"
            title="Next quote">
            <RefreshCw size={13} className={animating?'animate-spin':''}/>
          </button>
        </div>

        {/* Quote text */}
        <div className={`transition-all duration-200 ${animating?'opacity-0 translate-y-1':'opacity-100 translate-y-0'}`}>
          {/* Bangla quote */}
          <p className="font-bengali text-white/85 text-sm leading-relaxed mb-2">
            "{quote.bn}"
          </p>
          {/* English quote (smaller) */}
          {!isBn && (
            <p className="text-white/40 text-xs leading-relaxed italic mb-2 font-body">
              "{quote.en}"
            </p>
          )}
          {/* Author */}
          <p className="text-white/30 text-[10px] font-display text-right">
            — {quote.author}
          </p>
        </div>
      </div>
    </div>
  )
}
