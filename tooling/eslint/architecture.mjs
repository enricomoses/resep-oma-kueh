import path from 'node:path';

const normalize = (value) => value.replaceAll('\\', '/');

export const architectureRule = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      boundary: 'Import/call violates the bakery {{boundary}} boundary.',
    },
  },
  create(context) {
    const file = normalize(context.filename);
    const inSource = file.includes('/src/');
    if (!inSource) return {};
    const client = context.sourceCode.ast.body.some(
      (node) => node.directive === 'use client',
    );
    const ui =
      /\/src\/(components|providers)\//.test(file) ||
      file.includes('/_components/');
    const hook = file.includes('/src/hooks/');
    const service = file.includes('/src/services/');
    const pure = /\/src\/(constants|types|utils|validations)\//.test(file);
    const report = (node, boundary) =>
      context.report({ node, messageId: 'boundary', data: { boundary } });

    function check(node, value) {
      if (typeof value !== 'string') return;
      const target = value.startsWith('@/')
        ? '/src/' + value.slice(2)
        : value.startsWith('.')
          ? normalize(path.resolve(path.dirname(file), value))
          : value;
      const networkPackage = /^(axios|@supabase\/|@tanstack\/react-query)/.test(
        value,
      );
      const server =
        /\.server(?:\.[cm]?[jt]sx?)?$/.test(target) ||
        /\/lib\/supabase\/(server|proxy)$/.test(target);
      if (
        (ui || client || hook || service || pure) &&
        (server || value === 'server-only' || target.includes('/src/features/'))
      )
        report(node, 'client/server');
      if (/\/index\.[jt]s$/.test(file) && server) report(node, 'server barrel');
      if (
        (ui || hook) &&
        (/^(axios|@supabase\/)/.test(value) ||
          target.includes('/lib/axios') ||
          target.includes('/lib/supabase'))
      )
        report(node, 'UI → hook → service');
      if (ui && target.includes('/src/services'))
        report(node, 'UI → hook → service');
      if (
        hook &&
        (target === '/src/hooks' || /\/src\/hooks\/index$/.test(target))
      )
        report(node, 'hook barrel');
      if (
        service &&
        (networkPackage ||
          target.includes('/lib/supabase') ||
          /\/src\/(features|hooks|components)(?:\/|$)/.test(target))
      )
        report(node, 'browser service');
      if (
        file.includes('/src/app/') &&
        (/^@supabase\//.test(value) ||
          target.includes('/lib/supabase') ||
          target.includes('/lib/axios') ||
          target.includes('/src/services'))
      )
        report(node, 'BFF/server domain');
      if (
        pure &&
        (networkPackage ||
          /\/src\/(features|hooks|components|providers|services|lib)\//.test(
            target,
          ))
      )
        report(node, 'pure module');
      if (value === 'axios' && !file.includes('/src/lib/axios/'))
        report(node, 'Axios transport');
      if (
        file.includes('/src/features/') &&
        (/^(react|@tanstack\/react-query)$/.test(value) ||
          /\/src\/(hooks|components|services)\//.test(target))
      )
        report(node, 'server domain');
    }
    return {
      ImportDeclaration: (node) => check(node, node.source.value),
      ExportNamedDeclaration: (node) => {
        if (node.source) check(node, node.source.value);
      },
      ExportAllDeclaration: (node) => check(node, node.source.value),
      ImportExpression: (node) => check(node, node.source.value),
      CallExpression(node) {
        if (
          (ui || hook || service || pure || file.includes('/src/app/')) &&
          node.callee.type === 'Identifier' &&
          node.callee.name === 'fetch'
        )
          report(node, 'network transport');
      },
    };
  },
};
