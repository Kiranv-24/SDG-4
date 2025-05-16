import React from "react";
import { useTranslation } from "react-i18next";
import ankush from "../assets/ankush.jpeg";
import anuvab from "../assets/anuvab.png";
import bristi from "../assets/bristi.png";
import kaushan from "../assets/kaushan.png";
import debanjan from "../assets/debanjan.png";
import souvik from "../assets/souvik.jpeg";
import { Link } from "react-router-dom";
import { GiHamburgerMenu } from "react-icons/gi";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import GitHubIcon from "@mui/icons-material/GitHub";
import YouTubeIcon from "@mui/icons-material/YouTube";

const teamMembers = [
  {
    name: "Ankush Banerjee",
    roleKey: "full_stack",
    responsibilityKey: "architecture",
    image: ankush,
    linkedinLink: "https://www.linkedin.com/in/ankush2003/",
    gihubLink: "https://github.com/Ankush109",
  },
  {
    name: "Anuvab Chakravarty",
    roleKey: "design",
    responsibilityKey: "ideation",
    image: anuvab,
    linkedinLink: "https://www.linkedin.com/in/anuvab-chakravarty-001b39233/",
    githubLink: "https://github.com/Vanaub22",
  },
  {
    name: "Bristi Maity",
    roleKey: "ml",
    responsibilityKey: "ml",
    image: bristi,
    linkedinLink: "https://www.linkedin.com/in/bristi-maity-6260a5244/",
    githubLink: "https://github.com/bristi03",
  },
  {
    name: "Souvik Sen",
    roleKey: "full_stack",
    responsibilityKey: "architecture",
    image: souvik,
    linkedinLink: "https://www.linkedin.com/in/souvik001/",
    githubLink: "https://github.com/Souvik3469",
  },
  {
    name: "Kaushan Dutta",
    roleKey: "frontend",
    responsibilityKey: "frontend",
    image: kaushan,
    linkedinLink: "https://www.linkedin.com/in/kaushan-dutta-bb68b021a/",
    githubLink: "https://github.com/Kaushan-Dutta",
  },
  {
    name: "Debanjan Konar",
    roleKey: "ai_ml",
    responsibilityKey: "ai",
    image: debanjan,
    linkedinLink: "https://www.linkedin.com/in/debanjan-konar/",
    githubLink: "https://github.com/Uni-Bo",
  },
];

function TeamMember({
  name,
  roleKey,
  responsibilityKey,
  image,
  linkedinLink,
  gihubLink,
}) {
  const { t } = useTranslation();
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md m-4 max-w-xs">
      <img
        src={image}
        className="w-48 h-64 object-cover mx-auto mb-4 rounded-full"
        alt={name}
      />
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2">{name}</h1>
        <h2 className="text-sm text-gray-500 mb-2 font-bold">
          {t(`about_roles.${roleKey}`)}
        </h2>
        <p className="text-sm text-gray-700">
          {t(`about_responsibilities.${responsibilityKey}`)}
        </p>
        <div className="flex flex-row justify-center gap-6 my-3 ">
          <Link to={linkedinLink}>
            <LinkedInIcon />
          </Link>
          <Link to={gihubLink}>
            <GitHubIcon />
          </Link>
        </div>
      </div>
    </div>
  );
}

function About() {
  const { t } = useTranslation();

  return (
    <div className="bg-green-100 min-h-screen">
      <section className="fixed inset-x-0 mx-auto w-full custom-navbar-width z-10 py-5 ">
        <nav className="bg-white text-primary lg:flex hidden flex-row justify-between px-5 py-1 rounded-2xl shadow-md items-center text-para z-10 border-nav">
          <div className="mx-2 w-[200px]">
            <Link to="/" className="text-5xl font-right ">
              Green<span className="text-theme">IQ</span>
            </Link>
          </div>

          <div className="mx-2 h-20 list-none space-x-10 flex-row-center text-lg text-primary font-comf">
            <Link to="/">{t("nav_home")}</Link>
            <Link to="/user/book-meeting">{t("nav_dashboard")}</Link>
          </div>
        </nav>

        <nav className="text-primary flex lg:hidden flex-row justify-between px-5 py-2 my-4 rounded-lg shadow-md items-center text-para z-10 border-nav bg-white space-x-5">
          <div className="mx-2  w-[100px]">
            <Link to="" className="text-4xl font-right ">
              Green<span className="text-theme">IQ</span>
            </Link>
          </div>
          <div className="mx-2 flex-row-between">
            <p className="text-4xl font-heading">
              <GiHamburgerMenu />
            </p>
          </div>
        </nav>
      </section>

      <div className="flex flex-col justify-center items-center p-40 ">
        <h1 className="text-6xl font-bold bg-green-300 p-4 rounded-xl">
          {t("about_title")}
        </h1>
        <h1 className="text-2xl font-semibold my-3 text-center">
          {t("about_subtitle")}
        </h1>
        <img
          className="sm:block w-56 mx-6 object-cover rounded-full mb-5"
          src="https://i0.wp.com/opportunitycell.com/wp-content/uploads/2022/03/SIH2.png?fit=327%2C345&ssl=1"
          alt="SIH Logo"
        />
        <div className="flex items-center mx-auto">
          <p className="text-md text-center text-green-900 font-semibold mb-8">
            {t("about_description")}
          </p>
        </div>
        <h1 className="text-3xl font-bold mb-5">{t("about_team_title")}</h1>
        <p className="text-xl text-center">
          {t("about_project_info")}
          <Link
            className="mx-2"
            to="https://github.com/ankush109/GreenIQ-ORIGIN_SIH-2023"
          >
            <GitHubIcon />
          </Link>
          ||
          <Link
            className="mx-2"
            to="https://www.youtube.com/watch?v=9pKMHoUljrI"
          >
            <YouTubeIcon
              style={{
                color: "red",
              }}
            />
          </Link>
        </p>
        <div>
          <p className="bg-green-300 p-2 rounded-lg font-semibold m-3">
            {t("about_db_notice")}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap justify-center">
        {teamMembers.map((member, index) => (
          <TeamMember key={index} {...member} />
        ))}
      </div>
      <p className="text-center font-bold mx-auto p-10">
        {t("about_maintained_by")}
      </p>
    </div>
  );
}

export default About;
