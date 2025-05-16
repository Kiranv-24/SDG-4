import React from "react";
import { useTranslation } from "react-i18next";

const Searchbox = ({ text, searchQuery, setSearchQuery }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-x-5 my-5 h-[70px] font-comf flex-row-between mx-auto md:w-[500px] border-2 px-5 py-2 rounded-full">
      <input
        type="text"
        placeholder={t("search_placeholder")}
        className="w-full outline-none"
        onChange={(e) => setSearchQuery(e.target.value)}
        value={searchQuery}
      />
      <button className="mini-btn">{t("search_button")}</button>
    </div>
  );
};

export default Searchbox;
