import { AUTH_FORM_MODES } from "@/features/auth/types";

export const AUTH_PAGE_CONTENT = {
  login: {
    mode: AUTH_FORM_MODES.LOGIN,
    footer: "portal de acesso logimarui",
    formTitle: "Entrar na plataforma",
    formDescription:
      "Informe sua matricula e senha para acessar o ambiente.",
    submitLabel: "Entrar",
    helperText:
      "Em caso de indisponibilidade ou duvida de acesso, procure o time responsavel pela operacao.",
    successPrefix: "Sessao iniciada com sucesso.",
    secondaryLink: {
      label: "Precisa de acesso ao ambiente?",
      cta: "Cadastrar usuario",
      href: "/register",
    },
    auxiliaryLinks: [{ label: "Recuperar senha", href: "/forgot-password" }],
    fields: [
      {
        name: "employeeId",
        label: "Matricula",
        type: "text",
        inputMode: "numeric",
        placeholder: "Ex.: 12345",
        hint: "Informe a matricula corporativa vinculada ao seu acesso.",
        autoComplete: "username",
        required: true,
        validation: { isPositiveInteger: true },
      },
      {
        name: "password",
        label: "Senha",
        type: "password",
        placeholder: "Digite sua senha",
        hint: "Use a senha cadastrada para o seu perfil.",
        autoComplete: "current-password",
        required: true,
        validation: { minLength: 6 },
      },
    ],
  },
  register: {
    mode: AUTH_FORM_MODES.REGISTER,
    footer: "portal de acesso logimarui",
    formTitle: "Cadastrar novo usuario",
    formDescription:
      "Informe a matricula autorizada, o nome do usuario e a senha inicial para liberar o acesso.",
    submitLabel: "Cadastrar",
    helperText:
      "Use este fluxo para preparar acessos de novos colaboradores ou perfis previamente autorizados.",
    successPrefix: "Cadastro concluido com sucesso.",
    secondaryLink: {
      label: "Ja possui acesso?",
      cta: "Voltar para login",
      href: "/login",
    },
    auxiliaryLinks: [
      { label: "Esqueci minha senha", href: "/forgot-password" },
    ],
    fields: [
      {
        name: "employeeId",
        label: "Matricula",
        type: "text",
        inputMode: "numeric",
        placeholder: "Ex.: 12345",
        hint: "Informe uma matricula autorizada para criacao de acesso.",
        autoComplete: "username",
        required: true,
        validation: { isPositiveInteger: true },
      },
      {
        name: "username",
        label: "Nome do usuario",
        type: "text",
        placeholder: "Nome completo ou identificacao do usuario",
        hint: "Este nome sera usado para identificar o usuario no ambiente.",
        autoComplete: "name",
        required: true,
        validation: { minLength: 3 },
      },
      {
        name: "password",
        label: "Senha",
        type: "password",
        placeholder: "Crie uma senha",
        hint: "Defina uma senha inicial com no minimo 6 caracteres.",
        autoComplete: "new-password",
        required: true,
        validation: { minLength: 6 },
      },
      {
        name: "confirmPassword",
        label: "Confirmar senha",
        type: "password",
        placeholder: "Repita a senha",
        hint: "Repita a senha para confirmar o cadastro.",
        autoComplete: "new-password",
        required: true,
        validation: { matchesField: "password" },
      },
    ],
  },
  forgotPassword: {
    mode: AUTH_FORM_MODES.FORGOT_PASSWORD,
    footer: "portal de acesso logimarui",
    formTitle: "Recuperar acesso",
    formDescription:
      "Informe a matricula do usuario para registrar a solicitacao de troca de senha.",
    submitLabel: "Registrar solicitacao",
    helperText:
      "Depois do registro, a equipe pode acompanhar o status da solicitacao e orientar a proxima etapa do atendimento.",
    successPrefix: "Solicitacao registrada com sucesso.",
    secondaryLink: {
      label: "Lembrou da senha?",
      cta: "Voltar para login",
      href: "/login",
    },
    auxiliaryLinks: [{ label: "Criar conta", href: "/register" }],
    fields: [
      {
        name: "employeeId",
        label: "Matricula",
        type: "text",
        inputMode: "numeric",
        placeholder: "Ex.: 12345",
        hint: "Informe a matricula do colaborador que precisa redefinir a senha.",
        autoComplete: "username",
        required: true,
        validation: { isPositiveInteger: true },
      },
    ],
  },
};
