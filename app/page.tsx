"use client";

import App from "./components/App";
import GitHubButton from "react-github-btn";
import {Icon} from "@/app/components/Icon";

const Home = () => {
  return (
    <>
      <div className="h-full overflow-hidden">
        {/* height 4rem */}
        <div className="bg-gradient-to-b from-black/50 to-black/10 backdrop-blur-[2px] h-[4rem] flex items-center">
          <header className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-between">
            <div>
              <span>Speach and emotions recognition</span>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <span className="mt-1">
                <GitHubButton
                  href="https://github.com/Hydraulicus/nextjs-live-transcription"
                  data-color-scheme="no-preference: light; light: light; dark: light;"
                  data-size="large"
                  data-show-count="false"
                  aria-label="Star deepgram-starters/nextjs-live-transcription on GitHub"
                >
                  GitHub
                </GitHubButton>
              </span>

            </div>
          </header>
        </div>

        {/* height 100% minus 8rem */}
        <main className="main">
          <App />
        </main>

        {/* height 4rem */}
        <div className="bg-black/80 h-[4rem] flex items-center absolute w-full">
          <footer
              className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 flex items-center justify-center gap-4 md:text-xl font-inter text-[#8a8a8e]">
            <span className="text-base text-[#4e4e52]">Hire me</span>
            <a
                href="https://www.upwork.com/freelancers/~01db8123e8a706c7e5"
                aria-label="hire me on Upwork"
                target="_blank"
            >
              <Icon name="upworkIcon" opacity={0.66} className="mb-1"/>
            </a>
            <a
                href="https://www.linkedin.com/in/alexei-zababaurin-209479110/"
                aria-label="open my Linkedin"
                target="_blank"
            >
              <Icon name="linkedInIcon" fill="rgb(108, 138, 158)" className="mb-1"/>
            </a>
            <span className="text-base text-[#4e4e52]">contact me</span>
            <a
                href="mailto:alexei.zababurin@gmail.com"
                aria-label="email me"
                target="_blank"
            >
              <Icon name="email-icon" fill="rgb(138, 138, 142)"  className="mb-1"/>
            </a>
          </footer>
        </div>
      </div>
    </>
  );
};

export default Home;
