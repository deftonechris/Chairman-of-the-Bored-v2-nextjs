import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  HttpLink,
  ApolloLink,
} from "@apollo/client";
import "../styles/globals.css";
import { setContext } from "@apollo/client/link/context";
import Navbar from "../components/NavBar";
import { onError } from "@apollo/client/link/error";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/authContext"; 

const httpLink = new HttpLink({
  uri: '/api/graphql',
  headers: {
    'Content-Type': 'application/json',
  },
});


const requestLogger = new ApolloLink((operation, forward) => {
  console.log('Request:', operation);
  return forward(operation);
});

const authLink = setContext((_, { headers }) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("id_token") : null;
  const authorization = token ? `Bearer ${token}` : "";
  return {
    headers: {
      ...(headers || {}),
      authorization,
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors)
    graphQLErrors.map(({ message, locations, path }) =>
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      )
    );

  if (networkError) console.log(`[Network error]: ${networkError}`);
});

const client = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
});

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={client}>
      <AuthProvider> {/* Wrap your application with AuthProvider */}
        <MemoryRouter>
          <Navbar />
          <Component {...pageProps} />
        </MemoryRouter>
      </AuthProvider>
    </ApolloProvider>
  );
}

export default MyApp;

