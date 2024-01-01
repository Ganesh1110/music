import { Dimensions, Platform } from "react-native";

const BASE_URL = "http://localhost:3000";

const DIM = {
  deviceWidth: Math.round(Dimensions.get("window").width),
  deviceHeight: Math.round(Dimensions.get("window").height),
  deviceFont: Math.round(Dimensions.get("window").fontScale),
};

const iconWidth =
  Platform.OS == "android" ? DIM.deviceWidth * 0.06 : DIM.deviceWidth * 0.055;
const iconHeight =
  Platform.OS == "android" ? DIM.deviceHeight * 0.03 : DIM.deviceHeight * 0.025;

const Colors = {
  GhostWhite: "#FAFAFA",
  Iceberg: "#E7EEF6",
  Silver: "#C6C6C6",
  MilkWhite: "#FFFFFF",
  Mist: "#8F918F",
  CarbonGrey: "#636562",
  Charcoal: "#373A36",
  Black: "#000000",
  TRANSPARENT: "#0404045c",
};

const Gif = {
  // gif: require("../assets/gif/) format of the gif exports
};

const Icons = {
  // icons:require("../assets/icons/) format of the icons exports
};

const Images = {
  // images: require("../assets/images/) format of the image exports
};

export { DIM, Colors, Gif, Icons, Images, iconWidth, iconHeight, BASE_URL };
