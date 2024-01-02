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
  IconBack: require("../assets/Icons/back.png"),
  IconFillHeart: require("../assets/Icons/fill_heart.png"),
  IconEmptyHeart: require("../assets/Icons/empty_heart.png"),
  IconDownload: require("../assets/Icons/download.png"),
  IconSpotify: require("../assets/Icons/spotify.png"),
  IconYoutube: require("../assets/Icons/youtube.png"),
  IconPlay: require("../assets/Icons/play.png"),
  IconPause: require("../assets/Icons/pause.png"),
  IconNext: require("../assets/Icons/next.png"),
  IconShare: require("../assets/Icons/share.png"),
  IconMore: require("../assets/Icons/more.png"),
};

const Images = {
  // images: require("../assets/images/) format of the image exports
};

export { DIM, Colors, Gif, Icons, Images, iconWidth, iconHeight, BASE_URL };
