import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Star } from 'lucide-react';

const ZODIAC_SIGNS = [
  { id: 'aries', name: 'Овен', date: '21 мар — 19 апр', emoji: '♈' },
  { id: 'taurus', name: 'Телец', date: '20 апр — 20 май', emoji: '♉' },
  { id: 'gemini', name: 'Близнецы', date: '21 май — 20 июн', emoji: '♊' },
  { id: 'cancer', name: 'Рак', date: '21 июн — 22 июл', emoji: '♋' },
  { id: 'leo', name: 'Лев', date: '23 июл — 22 авг', emoji: '♌' },
  { id: 'virgo', name: 'Дева', date: '23 авг — 22 сен', emoji: '♍' },
  { id: 'libra', name: 'Весы', date: '23 сен — 22 окт', emoji: '♎' },
  { id: 'scorpio', name: 'Скорпион', date: '23 окт — 21 ноя', emoji: '♏' },
  { id: 'sagittarius', name: 'Стрелец', date: '22 ноя — 21 дек', emoji: '♐' },
  { id: 'capricorn', name: 'Козерог', date: '22 дек — 19 янв', emoji: '♑' },
  { id: 'aquarius', name: 'Водолей', date: '20 янв — 18 фев', emoji: '♒' },
  { id: 'pisces', name: 'Рыбы', date: '19 фев — 20 мар', emoji: '♓' },
];

const horoscopes: Record<string, string> = {
  aries: 'Сегодня звёзды советуют вам быть решительными. Не бойтесь брать на себя ответственность и проявлять инициативу. В личных отношениях возможны приятные сюрпризы. Хороший день для начала новых проектов.',
  taurus: 'День благоприятен для финансовых дел. Обратите внимание на новые возможности для заработка. В общении с близкими будьте терпеливы и внимательны к их потребностям.',
  gemini: 'Ваша коммуникабельность сегодня поможет решить многие вопросы. Не упускайте возможность завести новые знакомства. Вечером возможны романтические события.',
  cancer: 'Прислушайтесь к своей интуиции — она подскажет верное решение. День подходит для домашних дел и заботы о близких. Избегайте конфликтов на работе.',
  leo: 'Энергия сегодня бьёт ключом! Направьте её в продуктивное русло. Хороший день для занятий спортом и творчеством. Вечером возможны неожиданные встречи.',
  virgo: 'День требует внимания к деталям. Успех придёт через тщательное планирование. В личных отношениях возможны важные разговоры. Не откладывайте решение насущных вопросов.',
  libra: 'Звёзды рекомендуют найти баланс между работой и отдыхом. Хороший день для творчества и самовыражения. Возможны приятные новости от друзей.',
  scorpio: 'Ваша страсть и энергия помогут преодолеть любые препятствия. День благоприятен для решения сложных задач. Вечером уделите время себе.',
  sagittarius: 'Открытость новому опыту принесёт удачу. Хороший день для путешествий и обучения. В финансовых вопросах проявляйте осторожность.',
  capricorn: 'День подходит для карьерных дел и амбициозных планов. Ваша настойчивость будет вознаграждена. Не забывайте об отдыхе.',
  aquarius: 'Ваша креативность сегодня на высоте. Предлагайте смелые идеи — они найдут поддержку. Вечером возможны интересные знакомства.',
  pisces: 'Интуиция сегодня особенно сильна. Доверяйте своим предчувствиям. День благоприятен для творчества и духовных практик. Избегайте суеты.',
};

export default function HoroscopePage() {
  const [selected, setSelected] = useState<string | null>(null);
  const sign = ZODIAC_SIGNS.find(s => s.id === selected);

  return (
    <div className="pt-20 pb-8">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 mb-6">
          <Link to="/" className="sakh-caption transition-colors hover:text-[var(--accent-ocean)]">
            <ArrowLeft size={14} className="inline mr-1" />
            Главная
          </Link>
          <span className="sakh-caption" aria-hidden="true">/</span>
          <span className="sakh-caption text-[var(--accent-ocean)]" aria-current="page">Гороскоп</span>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="sakh-heading mb-2">Гороскоп на сегодня</h1>
          <p className="sakh-body">16 мая 2026</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {ZODIAC_SIGNS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s.id === selected ? null : s.id)}
              className={`sakh-card p-4 text-center transition-all ${
                selected === s.id ? 'border-[var(--accent-ocean)]' : ''
              }`}
            >
              <div className="text-3xl mb-2">{s.emoji}</div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{s.name}</div>
              <div className="sakh-caption text-[10px] mt-1">{s.date}</div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {sign && (
            <motion.div
              key={sign.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="sakh-card p-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{sign.emoji}</span>
                <div>
                  <h2 className="sakh-title">{sign.name}</h2>
                  <p className="sakh-caption">{sign.date}</p>
                </div>
              </div>
              <p className="sakh-body leading-relaxed">
                {horoscopes[sign.id]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
