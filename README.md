# LibreSign

A free and open-source digital signature solution.

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

## About

LibreSign is a project aimed at providing a secure, user-friendly way to digitally sign documents while respecting user privacy and freedom.

## Features (Planned)

- Document signing with cryptographic verification
- Multiple signature formats support
- User-friendly interface
- Privacy-focused design
- Open-source and transparent

## Development

This project is built as an Nx monorepo, with a NestJS backend and Next.js frontend.

### Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build server
npx nx serve client
```

### Add new libraries

You can add new libraries to the workspace using Nx generators:

```sh
npx nx g @nx/nest:lib shared-types
npx nx g @nx/react:lib ui-components
```

### Useful links

- [Learn more about Nx](https://nx.dev)
- [Learn about NestJS](https://nestjs.com)
- [Learn about Next.js](https://nextjs.org)