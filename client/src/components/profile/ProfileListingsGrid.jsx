import React from "react";
import { Link } from "react-router-dom";
import { PlusCircle } from "lucide-react";
import ProfileListingCard from "./ProfileListingCard";
import { getId } from "./profileUtils";

export default React.memo(function ProfileListingsGrid({
  items,
  tab,
  canManage,
  onRemove,
  onStatusAction,
  compact = false,
  onAppeal,
  selectable = false,
  selectedIds = new Set(),
  onToggleSelect,
}) {
  if (!items?.length) {
    return (
      <div className="rounded-3xl border bg-white p-10 text-center">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-sun-50 grid place-items-center mb-3">
          <PlusCircle className="text-sun" size={26} />
        </div>

        <div className="text-slate-800 font-semibold mb-1">
          {tab === "fav" ? "В избранном пока пусто" : "Пока нет объявлений"}
        </div>

        <div className="text-sm text-slate-500 mb-4">
          {tab === "fav"
            ? "Добавляйте объявления в избранное, чтобы быстро вернуться к ним."
            : "Создайте первое объявление, и после модерации оно появится на сайте."}
        </div>

        {tab === "my" ? (
          <Link
            to="/add"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-sun text-white hover:bg-sun-600 transition"
          >
            <PlusCircle size={18} />
            Подать объявление
          </Link>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border hover:bg-slate-50 transition"
          >
            На главную
          </Link>
        )}
      </div>
    );
  }

  return (
    <div
      className={`grid gap-3 ${
        compact
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      }`}
    >
      {items.map((ad) => {
        const id = getId(ad);
        return (
          <ProfileListingCard
            key={id}
            ad={ad}
            canManage={canManage}
            onRemove={onRemove}
            onStatusAction={onStatusAction}
            compact={compact}
            isFavorite={tab === "fav"}
            onAppeal={onAppeal}
            selectable={selectable}
            selected={selectedIds.has(String(id))}
            onToggleSelect={onToggleSelect}
          />
        );
      })}
    </div>
  );
});
