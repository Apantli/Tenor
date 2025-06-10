-- Script de base de datos relacional en Supabase (PostgreSQL) con las funciones utilizadas en el proyecto

CREATE TABLE retrospectives (
    id_retrospective SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    sprint_id TEXT NOT NULL,
    project_id TEXT NOT NULL
);

CREATE TABLE happiness (
    retrospective_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    happiness INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (retrospective_id) REFERENCES retrospectives(id_retrospective) ON DELETE CASCADE
);

CREATE TABLE logs (
    id_log SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    emotion TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE retrospective_answers (
    id_retro_answer SERIAL PRIMARY KEY,
    created_at TIMESTAMP DEFAULT NOW(),
    retrospective_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    question_num INTEGER NOT NULL,
    response_text TEXT NOT NULL,
    FOREIGN KEY (retrospective_id) REFERENCES retrospectives(id_retrospective) ON DELETE CASCADE
);

-- Indices

CREATE INDEX idx_happiness_retrospective ON happiness(retrospective_id);
CREATE INDEX idx_happiness_user ON happiness(user_id);
CREATE INDEX idx_happiness_date ON happiness(created_at);

CREATE INDEX idx_logs_user ON logs(user_id);
CREATE INDEX idx_logs_emotion ON logs(emotion);
CREATE INDEX idx_logs_date ON logs(created_at);

CREATE INDEX idx_answers_retrospective ON retrospective_answers(retrospective_id);
CREATE INDEX idx_answers_user ON retrospective_answers(user_id);
CREATE INDEX idx_answers_question ON retrospective_answers(question_num);
CREATE INDEX idx_answers_date ON retrospective_answers(created_at);

-- Funciones

-- 1. create_user_log

CREATE OR REPLACE FUNCTION create_user_log(
    userid CHARACTER VARYING,
    emotion CHARACTER VARYING
) RETURNS VOID AS $$
BEGIN
    INSERT INTO logs (user_id, emotion, created_at)
    VALUES (userid, emotion, NOW());
END;
$$ LANGUAGE plpgsql;

-- 2. get_last_user_happiness

CREATE OR REPLACE FUNCTION get_last_user_happiness(
    user_id_input TEXT,
    project_id_input TEXT
) RETURNS TABLE(user_id TEXT, happiness BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT H.user_id, H.happiness::BIGINT
    FROM happiness H
    JOIN retrospectives R ON R.id_retrospective = H.retrospective_id
    WHERE H.user_id = user_id_input
    AND R.project_id = project_id_input
    ORDER BY H.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 3. get_retrospective_answers

CREATE OR REPLACE FUNCTION get_retrospective_answers(
    p_review_id BIGINT,
    p_user_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT COALESCE(
        jsonb_object_agg(
            question_num::TEXT,
            response_text
        ),
        '{}'::JSONB
    )
    FROM retrospective_answers
    WHERE retrospective_id = p_review_id
    AND user_id = p_user_id
    INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- 4. get_retrospective_id

CREATE OR REPLACE FUNCTION get_retrospective_id(
    sprint_id_input TEXT,
    project_id_input TEXT
) RETURNS INTEGER AS $$
DECLARE
    retrospective_id INTEGER;
BEGIN
    SELECT id_retrospective INTO retrospective_id
    FROM retrospectives
    WHERE sprint_id = sprint_id_input
    AND project_id = project_id_input;

    IF retrospective_id IS NULL THEN
        INSERT INTO retrospectives (sprint_id, created_at, project_id)
        VALUES (sprint_id_input, NOW(), project_id_input)
        RETURNING id_retrospective INTO retrospective_id;
    END IF;
    
    RETURN retrospective_id;
END;
$$ LANGUAGE plpgsql;

-- 5. get_user_logs

CREATE OR REPLACE FUNCTION get_user_logs(
    userid CHARACTER VARYING
) RETURNS TABLE(
    id INTEGER,
    emotion CHARACTER VARYING,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT l.id_log, l.emotion, l.created_at
    FROM logs l
    WHERE l.user_id = userid
    ORDER BY l.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- 6. save_happiness
CREATE OR REPLACE FUNCTION save_happiness(
    review_id_input INTEGER,
    happiness_input INTEGER
) RETURNS VOID AS $$
BEGIN
    INSERT INTO happiness (retrospective_id, user_id, happiness)
    VALUES (review_id_input, 'current_user', happiness_input);
END;
$$ LANGUAGE plpgsql;

-- 7. save_retrospective_answer

CREATE OR REPLACE FUNCTION save_retrospective_answer(
    p_review_id BIGINT,
    p_user_id TEXT,
    p_question_num INTEGER,
    p_response_text TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM retrospective_answers
        WHERE retrospective_id = p_review_id
        AND user_id = p_user_id
        AND question_num = p_question_num
    ) INTO v_exists;

    IF NOT v_exists THEN
        INSERT INTO retrospective_answers (
            retrospective_id,
            user_id,
            question_num,
            response_text,
            created_at
        ) VALUES (
            p_review_id,
            p_user_id,
            p_question_num,
            p_response_text,
            NOW()
        );

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

