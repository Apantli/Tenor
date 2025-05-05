import clsx from "clsx";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import HomepageFeatures from "@site/src/components/HomepageFeatures";

import Heading from "@theme/Heading";
import styles from "./index.module.css";

function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx("hero", styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <Heading as="h1" className="hero__title">
              {siteConfig.title} Documentation
            </Heading>
            <p className="hero__subtitle">{siteConfig.tagline}</p>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg"
                to="/docs/intro"
              >
                Get Started
              </Link>
              <Link
                className="button button--secondary button--lg"
                to="/docs/architecture"
                style={{ color: "white" }}
              >
                View Architecture
              </Link>
            </div>
          </div>
          <div className={styles.heroImage}>
            <img src="img/dashboard_mockup.png" alt="Tenor Dashboard" />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} Documentation`}
      description="Official documentation for Tenor - Modern Project Management for Agile Teams"
    >
      <HomepageHeader />
      <main>
        <div className="container">
          <div className={styles.keyFeatures}>
            <Heading as="h2" className={styles.featuresTitle}>
              Key Features
            </Heading>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>📋</div>
                <Heading as="h3">Backlog Management</Heading>
                <p>
                  Organize user stories, requirements, and track backlogs with
                  ease
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🏃</div>
                <Heading as="h3">Sprint Planning</Heading>
                <p>
                  Create and manage sprints with flexible durations and
                  capacities
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>✅</div>
                <Heading as="h3">Task Management</Heading>
                <p>
                  Break down work into trackable tasks with assignable team
                  members
                </p>
              </div>
              <div className={styles.featureCard}>
                <div className={styles.featureIcon}>🤖</div>
                <Heading as="h3">AI-Powered Assistance</Heading>
                <p>Generate tasks and other items with built-in AI tools</p>
              </div>
            </div>
          </div>
        </div>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
