// @ts-check
import { module } from "@prisma/composer";
import izinoService from "./service.mjs";

export default module("izino", ({ provision }) => {
  provision(izinoService);
});
