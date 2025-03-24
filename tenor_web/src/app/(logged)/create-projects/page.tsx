"use client";

import { api } from "~/trpc/react";
import { useState, useEffect } from "react";
import PrimaryButton from "~/app/_components/PrimaryButton";
import { FilterSearch } from "~/app/_components/FilterSearch";

export default function ProjectCreator() {
  return (
    <div>
      <div className="header w-full h-32 flex justify-between">
        <h2>Project Creator</h2>
        <PrimaryButton>Generate Project</PrimaryButton>
      </div>
      <div className="content">
        <div className="project-primary-info">
          <div className="project-name-icon">
            <div>
              <h3>Project Name</h3>
              <input type="text" placeholder="Example" />
            </div>
            <div>
              <h3>Project Icon</h3>
              <button>Attach Image...</button>
            </div>
          </div>
          <div className="project-description">
            <h3>Project Description</h3>
            <textarea placeholder="Description..." />
          </div>
          <div className="project-team-members">
            <h3>Team Members</h3>
            <div>
              <FilterSearch list={[]} onSearch={(searchTerm) => console.log(searchTerm)}></FilterSearch>
              <PrimaryButton>+ Add Member</PrimaryButton>
            </div>
          </div>
        </div>
        <div>
          <div className="project-context">
            <h3>Project Context</h3>
            <textarea placeholder="Context..." />
          </div>
          <div className="context-files">

          </div>
          <div className="context-links">

          </div>
        </div>
      </div>
    </div>
  )
}