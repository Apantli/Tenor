import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Complete Project Management",
    icon: "🔄",
    description: (
      <>
        Tenor provides end-to-end management for agile projects from initial
        requirements to sprint planning, task tracking, and performance
        analysis.
      </>
    ),
  },
  {
    title: "AI-Powered Assistance",
    icon: "🤖",
    description: (
      <>
        Generate tasks, user stories, and issues automatically using Tenor's
        built-in AI capabilities to accelerate your workflow.
      </>
    ),
  },
  {
    title: "Team Collaboration",
    icon: "👥",
    description: (
      <>
        Enable effective team collaboration with customizable roles and
        permissions, real-time updates, and transparent task assignment.
      </>
    ),
  },
];

function Feature({ icon, title, description }) {
  return (
    <div className={clsx("col col--4")}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>{icon}</div>
        <div className={styles.featureContent}>
          <Heading as="h3" className={styles.featureTitle}>
            {title}
          </Heading>
          <p>{description}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <Heading as="h2" className={styles.featuresHeading}>
          Why Choose Tenor?
        </Heading>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
        <div className={styles.cta}>
          <a href="/docs/intro" className="button button--primary button--lg">
            Explore Documentation
          </a>
        </div>
      </div>
    </section>
  );
}
