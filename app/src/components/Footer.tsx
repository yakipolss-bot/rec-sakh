import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const footerLinks = [
  {
    title: 'Разделы',
    links: [
      { label: 'Общество', href: '/category/obshchestvo' },
      { label: 'Происшествия', href: '/category/proisshestviya' },
      { label: 'Экономика', href: '/category/ekonomika' },
      { label: 'Спорт', href: '/category/sport' },
      { label: 'Культура', href: '/category/kultura' },
    ],
  },
  {
    title: 'Сервисы',
    links: [
      { label: 'Погода', href: '#' },
      { label: 'Курсы валют', href: '#' },
      { label: 'Расписание транспорта', href: '#' },
      { label: 'Афиша', href: '#' },
      { label: 'Работа', href: '#' },
    ],
  },
  {
    title: 'О проекте',
    links: [
      { label: 'О портале', href: '#' },
      { label: 'Реклама', href: '#' },
      { label: 'Контакты', href: '#' },
      { label: 'Пользовательское соглашение', href: '#' },
      { label: 'Политика конфиденциальности', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      className="mt-16 pt-12 pb-8"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span
                className="font-mono text-lg tracking-[0.1em] uppercase"
                style={{ color: 'var(--text-primary)', fontWeight: 500 }}
              >
                SAKHALIN
              </span>
              <span
                className="w-[2px] h-5 inline-block"
                style={{ backgroundColor: 'var(--accent-ocean)' }}
              />
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)', lineHeight: 1.6 }}>
              Региональный информационный портал Сахалинской области. Новости, афиша, погода, работа и объявления.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={14} />
                <span>Южно-Сахалинск, ул. Ленина, 1</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Phone size={14} />
                <span>+7 (4242) 72-00-00</span>
              </div>
              <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                <Mail size={14} />
                <span>info@rec-sakh.ru</span>
              </div>
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4
                className="text-sm uppercase tracking-[0.05em] font-medium mb-4"
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
              >
                {group.title}
              </h4>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm transition-colors duration-200 hover:text-[var(--accent-ocean)]"
                      style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border-color)' }}
        >
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            © 2026 Sakhcom. Все права защищены.
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Сахалинская область, UTC+11
          </p>
        </div>
      </div>
    </footer>
  );
}
