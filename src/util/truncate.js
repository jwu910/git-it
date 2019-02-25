export const truncate = (str, length, ending = '...') => {
  return str.substring(0, length) + ending;
};
