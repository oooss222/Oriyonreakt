import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ListingForm from "../components/ListingForm";

export default function AddListing() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCat = searchParams.get("cat") || "";

  return (
    <ListingForm
      mode="create"
      initialCat={initialCat}
      backTo="/profile?tab=my"
      onSuccess={(created) => nav(`/ad/${created.id || created._id}`)}
    />
  );
}
