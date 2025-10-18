import React from "react";
import { Link } from "react-router-dom";
import {
  Facebook,
  Instagram,
  Youtube,
  Mail,
  Phone,
  ShieldCheck,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-10 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200">
      <div className="container-x py-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

        {/* 🔒 Безопасные сделки */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="text-accent w-5 h-5" />
            <h2 className="text-lg font-semibold text-brand">Безопасные сделки</h2>
          </div>
          <ul className="space-y-1 text-slate-600 text-sm leading-relaxed">
            <li>• Встречайтесь в людных местах и проверяйте товар.</li>
            <li>• Не переводите предоплату незнакомым продавцам.</li>
            <li>• Не делитесь данными банковских карт.</li>
            <li>• Сообщайте о подозрительных объявлениях в поддержку.</li>
          </ul>
        </div>

        {/* ⚡️ Быстрые ссылки */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-brand">Oriyon.store</h2>
          <ul className="space-y-1 text-slate-600 text-sm">
            <li><Link to="/policy" className="hover:text-accent">Политика сайта</Link></li>
          </ul>
        </div>

        {/* 📞 Контакты */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-brand">Контакты</h2>
          <ul className="space-y-2 text-slate-600 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-accent" /> support@oriyon.store
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-accent" /> +992 900 00 00 00
            </li>
            <li>г. Душанбе, Таджикистан</li>
          </ul>
        </div>

        {/* 🌐 Соцсети */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-brand">Мы в соцсетях</h2>
          <div className="flex items-center gap-3">
            <a href="#" className="text-slate-600 hover:text-accent">
              <Facebook size={22} />
            </a>
            <a href="#" className="text-slate-600 hover:text-accent">
              <Instagram size={22} />
            </a>
            <a href="#" className="text-slate-600 hover:text-accent">
              <Youtube size={22} />
            </a>
          </div>
        </div>
      </div>

      {/* Нижняя полоса */}
      <div className="border-t border-slate-200 bg-white py-4 text-center text-slate-500 text-sm">
        © {new Date().getFullYear()} Oriyon.store — платформа объявлений Таджикистана
      </div>
    </footer>
  );
}
