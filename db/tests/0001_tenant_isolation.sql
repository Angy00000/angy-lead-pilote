-- Test d'isolation multi-tenant — à exécuter avec le rôle propriétaire.
-- Crée deux organisations A et B, tente des accès croisés, puis lève une
-- exception volontaire : TOUT est annulé, aucune donnée ne reste en base.
-- Résultat attendu : "T00 OK; T0 OK; T0b OK; T0c OK; T1 OK; ... T8 OK" (13 tests).

DO $t$
DECLARE
  ua uuid := gen_random_uuid(); ub uuid := gen_random_uuid();
  oa uuid := gen_random_uuid(); ob uuid := gen_random_uuid();
  n int; r text := '';
BEGIN
  INSERT INTO neon_auth."user"(id,name,email,"emailVerified","createdAt","updatedAt") VALUES
    (ua,'Test A','a@test.invalid',true,now(),now()),(ub,'Test B','b@test.invalid',true,now(),now());
  INSERT INTO neon_auth.organization(id,name,slug,"createdAt") VALUES
    (oa,'Org A','org-a-test',now()),(ob,'Org B','org-b-test',now());
  INSERT INTO neon_auth.member(id,"organizationId","userId",role,"createdAt") VALUES
    (gen_random_uuid(),oa,ua,'owner',now()),(gen_random_uuid(),ob,ub,'owner',now());

  -- T00/T0/T0b : le rôle de connexion n'a ni BYPASSRLS ni accès direct
  SET LOCAL ROLE angy_lp_web;
  SELECT rolbypassrls::int INTO n FROM pg_roles WHERE rolname = current_user;
  r := r || CASE WHEN n=0 THEN 'T00 OK; ' ELSE 'T00 ECHEC; ' END;
  BEGIN PERFORM count(*) FROM app.organization_settings; r := r || 'T0 ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T0 OK; '; END;
  BEGIN PERFORM count(*) FROM neon_auth.member; r := r || 'T0b ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T0b OK; '; END;
  BEGIN EXECUTE 'CREATE TEMP TABLE t_probe(x int)'; r := r || 'T0c ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T0c OK; '; END;

  SET LOCAL ROLE angy_lp_rls;
  -- T1 : A voit ses données
  PERFORM set_config('app.user_id', ua::text, true);
  PERFORM set_config('app.organization_id', oa::text, true);
  INSERT INTO app.organization_settings(organization_id, sector) VALUES (oa,'tech');
  SELECT count(*) INTO n FROM app.organization_settings;
  r := r || CASE WHEN n=1 THEN 'T1 OK; ' ELSE 'T1 ECHEC; ' END;
  -- T2 : A ne peut pas écrire pour B
  BEGIN INSERT INTO app.organization_settings(organization_id) VALUES (ob); r := r || 'T2 ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T2 OK; '; END;
  -- T3/T3b : A usurpe le contexte de B (non membre) => rien
  PERFORM set_config('app.organization_id', ob::text, true);
  SELECT count(*) INTO n FROM app.organization_settings;
  r := r || CASE WHEN n=0 THEN 'T3 OK; ' ELSE 'T3 ECHEC; ' END;
  BEGIN INSERT INTO app.organization_settings(organization_id) VALUES (ob); r := r || 'T3b ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T3b OK; '; END;
  -- T4/T5 : B ne voit ni ne modifie A
  PERFORM set_config('app.user_id', ub::text, true);
  INSERT INTO app.organization_settings(organization_id) VALUES (ob);
  SELECT count(*) INTO n FROM app.organization_settings WHERE organization_id = oa;
  r := r || CASE WHEN n=0 THEN 'T4 OK; ' ELSE 'T4 ECHEC; ' END;
  UPDATE app.organization_settings SET plan='enterprise' WHERE organization_id = oa;
  GET DIAGNOSTICS n = ROW_COUNT;
  r := r || CASE WHEN n=0 THEN 'T5 OK; ' ELSE 'T5 ECHEC; ' END;
  -- T6/T7 : audit append-only, auteur imposé
  INSERT INTO app.audit_log(organization_id, actor_user_id, action) VALUES (ob, ub, 'test');
  BEGIN DELETE FROM app.audit_log; r := r || 'T6 ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T6 OK; '; END;
  BEGIN INSERT INTO app.audit_log(organization_id, actor_user_id, action) VALUES (ob, ua, 'usurpation'); r := r || 'T7 ECHEC; ';
  EXCEPTION WHEN insufficient_privilege THEN r := r || 'T7 OK; '; END;
  -- T8 : sans contexte => rien
  PERFORM set_config('app.organization_id', '', true);
  SELECT count(*) INTO n FROM app.organization_settings;
  r := r || CASE WHEN n=0 THEN 'T8 OK' ELSE 'T8 ECHEC' END;

  RAISE EXCEPTION 'RESULTATS (rollback volontaire): %', r;
END $t$;
