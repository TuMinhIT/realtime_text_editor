import AllProjects from "../components/projects/allProjects";

import { useEffect } from "react";
import INFO from "../data/user";

const Projects = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col bg-base-100 relative">
        {/* Main container */}
        <div className="flex-1 container mx-auto px-5 mt-20">
          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Things I’ve made trying to put my dent in the universe.
          </h1>

          {/* Subtitle */}
          <p className="text-base-content/70 max-w-3xl leading-relaxed mb-10">
            I've worked on a variety of projects over the years and I'm proud of
            the progress I've made. Many of these projects are open-source and
            available for others to explore and contribute to. If you're
            interested in any of the projects I've worked on, feel free to check
            the code and suggest improvements. Collaboration is one of the best
            ways to grow, and I'm always open to new ideas.
          </p>
        </div>
        <div className="">
          <AllProjects />
        </div>
      </div>
    </>
  );
};

export default Projects;
