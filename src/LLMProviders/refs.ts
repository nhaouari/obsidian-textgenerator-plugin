import InputComp from "#/ui/settings/components/input";
import useGlob from "#/ui/context/global";
import DropdownComp from "#/ui/settings/components/dropdown";
import DropdownSearchComp from "#/ui/settings/components/dropdownSearch";
import SettingItemComp from "#/ui/settings/components/item";
import type { ContextTemplate as CTT } from "#/scope/context-manager";
import type { Register as RGX } from "#/ui/settings/sections";
import { Message as MSG } from "#/types";
import { AI_MODELS as MODELS } from "#/constants";
import { RequestUrlParam, requestUrl, request } from "obsidian";
import { getHBValues as gHBValues } from "#/utils/barhandles";

export { chains, splitters } from "#/lib/langchain";


export const fetchWithoutCORS = request;
export const requestWithoutCORS = requestUrl;
export const useGlobal = useGlob;
export const Dropdown = DropdownComp;
export const DropdownSearch = DropdownSearchComp;
export const SettingItem = SettingItemComp;
export const Input = InputComp;
export const getHBValues = gHBValues;


export const AI_MODELS = MODELS;

export type requestWithoutCORSParam = RequestUrlParam;
export type ContextTemplate = CTT;
export type Register = RGX;
export type Message = MSG;