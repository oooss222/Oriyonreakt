import React from "react";

export default function Policy() {
  return (
    <div className="container-x py-6">
      <div className="max-w-3xl mx-auto card p-6 space-y-4">
        <h1 className="text-2xl font-bold mb-2">Политика конфиденциальности и условия использования</h1>
        <p className="text-slate-600">
          Настоящая Политика конфиденциальности описывает, какие данные собираются при использовании
          сайта <span className="font-semibold">Oriyon.store</span>, как они обрабатываются и защищаются.
          Используя сайт, вы соглашаетесь с этой Политикой.
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">1. Общие положения</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>Сайт Oriyon.store предоставляет пользователям возможность размещать и просматривать объявления.</li>
            <li>При регистрации вы предоставляете имя, адрес электронной почты и пароль для входа.</li>
            <li>Администрация сайта обязуется не передавать персональные данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законом.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">2. Сбор и использование информации</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>Мы можем собирать технические данные о вашем устройстве, IP-адрес, время посещения и страницы сайта для анализа работы сервиса.</li>
            <li>Эти данные используются исключительно для улучшения качества обслуживания и не передаются третьим лицам.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">3. Объявления и пользовательский контент</h2>
          <p className="text-slate-600">
            Пользователь несет полную ответственность за содержание размещаемых объявлений.
            Запрещено публиковать материалы, нарушающие законы Республики Таджикистан, авторские права или права третьих лиц.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">4. Cookies</h2>
          <p className="text-slate-600">
            Сайт может использовать файлы cookies для сохранения пользовательских настроек и улучшения работы интерфейса.
            Вы можете отключить cookies в настройках браузера, однако это может повлиять на функциональность сайта.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">5. Изменения политики</h2>
          <p className="text-slate-600">
            Мы оставляем за собой право изменять данную Политику в любое время. Актуальная версия всегда доступна на странице <code>/policy</code>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-semibold">6. Контакты</h2>
          <p className="text-slate-600">
            Если у вас возникли вопросы по обработке данных или работе сайта, свяжитесь с нами:
          </p>
          <ul className="list-disc pl-5 text-slate-600 space-y-1">
            <li>Email: <a href="mailto:support@oriyon.store" className="text-accent">support@oriyon.store</a></li>
            <li>Телефон: +992 900 00 00 00</li>
          </ul>
        </section>

        <div className="text-sm text-slate-500 border-t pt-3">
          Последнее обновление: 15 октября 2025 г.
        </div>
      </div>
    </div>
  );
}
