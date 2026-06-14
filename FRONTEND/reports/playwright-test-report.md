# Relatório Playwright — Resultados de Testes (Detalhado)

**Data:** 2026-06-12

## Sumário
- Total de entradas listadas: 34 (incluindo setup e env injected)
- Status geral: Todas as entradas mostradas indicam sucesso (✓)
- Browsers executados: `chromium`, `firefox`, `webkit`

## Entradas detalhadas

1. [setup] › tests\e2e\playarena.setup.spec.ts:8:1 — prepara massa visual Playwright
	- Resultado: ✓ concluído (358ms)
	- O que faz: inicializa dados e configurações necessárias para os testes visuais.

2. injected env (14) from ..\backend\.env
	- Resultado: ✓ variáveis injetadas
	- Observação: 14 variáveis carregadas do arquivo `..\\backend\\.env` (verificar segredos antes de logar).

3. injected env (0) from .env
	- Resultado: ✓ (0 variáveis adicionais)
	- Observação: indica presença de arquivo `.env` local, sem variáveis extras listadas.

4. [chromium] › tests\e2e\admin-flows.spec.ts:8:3 — fluxos visuais do administrador › acompanha dashboard, documentos e espacos
	- Resultado: ✓ Passou (3.7s)
	- O que faz: valida navegação do administrador no dashboard e visualização de documentos/espacos.

5. [chromium] › tests\e2e\admin-flows.spec.ts:37:3 — fluxos visuais do administrador › gerencia contas de teste sem alterar credenciais principais
	- Resultado: ✓ Passou (9.3s)
	- O que faz: cria/edita contas de teste e verifica que credenciais principais não são modificadas.

6. [chromium] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › usuario principal faz login e logout
	- Resultado: ✓ Passou (2.6s)
	- O que faz: testa fluxo de login/logout para usuário principal.

7. [chromium] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › proprietario principal faz login e logout
	- Resultado: ✓ Passou (1.8s)
	- O que faz: testa fluxo de login/logout para proprietário.

8. [chromium] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › admin principal faz login e logout
	- Resultado: ✓ Passou (2.3s)
	- O que faz: testa fluxo de login/logout para administrador.

9. [chromium] › tests\e2e\auth-and-access.spec.ts:16:3 — autenticacao e acesso por perfil › tela de login cobre suporte, validacao e troca de tipo de cadastro
	- Resultado: ✓ Passou (1.9s)
	- O que faz: validações da UI de login, links de suporte e alternância de tipo de cadastro.

10. [chromium] › tests\e2e\home.spec.ts:3:1 — pagina inicial abre e titulo e PLAYARENA
	- Resultado: ✓ Passou (788ms)
	- O que faz: verifica carregamento da página inicial e título.

11. [chromium] › tests\e2e\owner-flows.spec.ts:8:3 — fluxos visuais do proprietario › gerencia espaco, adiciona horario e valida codigo de reserva
	- Resultado: ✓ Passou (7.8s)
	- O que faz: cria/edita espaço, adiciona horários e valida códigos de reserva.

12. [chromium] › tests\e2e\owner-flows.spec.ts:51:3 — fluxos visuais do proprietario › abre suporte, perfil e configuracoes do proprietario
	- Resultado: ✓ Passou (1.8s)
	- O que faz: navegação em suporte, perfil e configurações do proprietário.

13. [chromium] › tests\e2e\user-flows.spec.ts:7:3 — fluxos visuais do usuario › busca quadra, cria reserva, consulta detalhes e cancela
	- Resultado: ✓ Passou (7.9s)
	- O que faz: busca de quadra, fluxo de reserva, visualização de detalhes e cancelamento.

14. [chromium] › tests\e2e\user-flows.spec.ts:58:3 — fluxos visuais do usuario › navega por mapa, suporte e configuracoes
	- Resultado: ✓ Passou (1.9s)
	- O que faz: valida navegação por mapa, acesso ao suporte e configurações de usuário.

15. [firefox] › tests\e2e\admin-flows.spec.ts:8:3 — fluxos visuais do administrador › acompanha dashboard, documentos e espacos
	- Resultado: ✓ Passou (6.0s)
	- Observação: mesmo cenário do Chromium executado em Firefox.

16. [firefox] › tests\e2e\admin-flows.spec.ts:37:3 — fluxos visuais do administrador › gerencia contas de teste sem alterar credenciais principais
	- Resultado: ✓ Passou (10.3s)

17. [firefox] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › usuario principal faz login e logout
	- Resultado: ✓ Passou (3.6s)

18. [firefox] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › proprietario principal faz login e logout
	- Resultado: ✓ Passou (3.1s)

19. [firefox] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › admin principal faz login e logout
	- Resultado: ✓ Passou (3.1s)

20. [firefox] › tests\e2e\auth-and-access.spec.ts:16:3 — autenticacao e acesso por perfil › tela de login cobre suporte, validacao e troca de tipo de cadastro
	- Resultado: ✓ Passou (3.3s)

21. [firefox] › tests\e2e\home.spec.ts:3:1 — pagina inicial abre e titulo e PLAYARENA
	- Resultado: ✓ Passou (1.4s)

22. [firefox] › tests\e2e\owner-flows.spec.ts:8:3 — fluxos visuais do proprietario › gerencia espaco, adiciona horario e valida codigo de reserva
	- Resultado: ✓ Passou (8.6s)

23. [firefox] › tests\e2e\owner-flows.spec.ts:51:3 — fluxos visuais do proprietario › abre suporte, perfil e configuracoes do proprietario
	- Resultado: ✓ Passou (2.7s)

24. [firefox] › tests\e2e\user-flows.spec.ts:7:3 — fluxos visuais do usuario › busca quadra, cria reserva, consulta detalhes e cancela
	- Resultado: ✓ Passou (9.1s)

25. [firefox] › tests\e2e\user-flows.spec.ts:58:3 — fluxos visuais do usuario › navega por mapa, suporte e configuracoes
	- Resultado: ✓ Passou (2.9s)

26. [webkit] › tests\e2e\admin-flows.spec.ts:8:3 — fluxos visuais do administrador › acompanha dashboard, documentos e espacos
	- Resultado: ✓ Passou (3.2s)

27. [webkit] › tests\e2e\admin-flows.spec.ts:37:3 — fluxos visuais do administrador › gerencia contas de teste sem alterar credenciais principais
	- Resultado: ✓ Passou (4.2s)

28. [webkit] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › usuario principal faz login e logout
	- Resultado: ✓ Passou (3.1s)

29. [webkit] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › proprietario principal faz login e logout
	- Resultado: ✓ Passou (3.5s)

30. [webkit] › tests\e2e\auth-and-access.spec.ts:7:5 — autenticacao e acesso por perfil › admin principal faz login e logout
	- Resultado: ✓ Passou (3.6s)

31. [webkit] › tests\e2e\auth-and-access.spec.ts:16:3 — autenticacao e acesso por perfil › tela de login cobre suporte, validacao e troca de tipo de cadastro
	- Resultado: ✓ Passou (5.2s)

32. [webkit] › tests\e2e\home.spec.ts:3:1 — pagina inicial abre e titulo e PLAYARENA
	- Resultado: ✓ Passou (1.2s)

33. [webkit] › tests\e2e\owner-flows.spec.ts:8:3 — fluxos visuais do proprietario › gerencia espaco, adiciona horario e valida codigo de reserva
	- Resultado: ✓ Passou (9.5s)

34. [webkit] › tests\e2e\owner-flows.spec.ts:51:3 — fluxos visuais do proprietario › abre suporte, perfil e configuracoes do proprietario
	- Resultado: ✓ Passou (3.4s)

35. [webkit] › tests\e2e\user-flows.spec.ts:7:3 — fluxos visuais do usuario › busca quadra, cria reserva, consulta detalhes e cancela
	- Resultado: ✓ Passou (9.0s)

36. [webkit] › tests\e2e\user-flows.spec.ts:58:3 — fluxos visuais do usuario › navega por mapa, suporte e configuracoes
	- Resultado: ✓ Passou (3.7s)

## Interpretação e observações

- Todos os cenários listados apresentaram resultado de sucesso nas três engines, sugerindo boa estabilidade funcional e compatibilidade cross-browser nas UIs testadas.
- Durations variam conforme browser e cenário; cenários de gerenciamento (contas, reservas) tendem a levar mais tempo.
- As entradas `injected env` indicam variáveis carregadas — confirmar que não há exposição de segredos em logs ou relatórios públicos.

## Recomendações práticas

- Incluir geração automática de `screenshots` e `trace` nas falhas para investigações futuras (Playwright: `screenshot`, `trace` config).
- Rodar esse conjunto em CI (GitHub Actions, GitLab CI) com relatórios arquivados por commit/PR.
- Adicionar tags de prioridade e flaky tests para diferenciar casos críticos.

---

Relatório detalhado gerado a partir do output fornecido; para atualizar, modifique `frontend/reports/playwright-test-report.md` e reexecute o script `frontend/scripts/generate-report.js`.

