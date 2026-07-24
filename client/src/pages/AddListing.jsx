import React from "react";
import { useNavigate } from "react-router-dom";
import ListingForm from "../components/ListingForm";

export default function AddListing() {
  const nav = useNavigate();

  return (
    <ListingForm
      mode="create"
      backTo="/profile?tab=my"
      onSuccess={(created) => nav(`/ad/${created.id || created._id}`)}
    />
  );
}
