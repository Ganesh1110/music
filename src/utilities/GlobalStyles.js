import { Appearance, Platform, StyleSheet } from "react-native";
import { Colors, DIM, iconHeight, iconWidth } from "./Constants";

let colorScheme = Appearance.getColorScheme();

const FontColorChange = () => {
  if (colorScheme === "dark") {
    return false;
  } else {
    return true;
  }
};

const GlobalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.GhostWhite,
  },
  marginView: {
    marginLeft: DIM.deviceWidth * 0.02,
    marginRight: DIM.deviceWidth * 0.02,
  },
  iconSize: {
    width: iconWidth,
    height: iconHeight,
    resizeMode: "contain",
  },
  cardView: {
    borderWidth: DIM.deviceWidth * 0.003,
    borderColor: Colors.GhostWhite,
    borderRadius: DIM.deviceWidth * 0.03,
    backgroundColor: Colors.MilkWhite,
    marginTop: DIM.deviceHeight * 0.01,
    shadowColor: Colors.Black,
    elevation: Platform.OS == "android" ? 4 : 0,
    shadowOffset: {
      width: 0,
      height: Platform.OS == "ios" ? 9 : 12,
    },
    shadowOpacity: 0.8,
  },
  TextInputView: {
    borderWidth: DIM.deviceWidth * 0.003,
    marginTop: DIM.deviceHeight * 0.01,
    borderRadius: DIM.deviceWidth * 0.02,
  },
  TextInput: {
    height: 46,
    fontSize: DIM.deviceFont * 16,
    borderRadius: DIM.deviceWidth * 0.02,
    fontWeight: "700",
    fontStyle: "normal",
    padding: 10,
    // fontFamily: Font_Body,
    color: FontColorChange() ? Colors.Charcoal : Colors.Black,
  },
  PasswordInputView: {
    flexDirection: "row",
    borderWidth: DIM.deviceWidth * 0.003,
    marginTop: DIM.deviceHeight * 0.01,
    borderRadius: DIM.deviceWidth * 0.02,
  },
  PasswordTextInput: {
    height: 46,
    fontSize: DIM.deviceFont * 16,
    borderRadius: DIM.deviceWidth * 0.02,
    fontWeight: "700",
    padding: 10,
    width: "85%",
    fontStyle: "normal",
    // fontFamily: Font_Body,
    color: Colors.Charcoal,
  },
});

export { GlobalStyles, FontColorChange };
