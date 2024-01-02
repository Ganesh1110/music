import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Colors, DIM } from "../utilities/Constants";
import { GlobalStyles } from "../utilities/GlobalStyles";

const CustomHeader = ({
  heading,
  leftIconName,
  onLeftIconPress,
  rightIconName,
  onRightIconPress,
  headerBg,
}) => {
  return (
    <View
      style={{
        backgroundColor: headerBg ? headerBg : Colors.White,
        padding: 15,
        flexDirection: "row",
      }}
    >
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1 }}>
          {leftIconName && (
            <>
              <TouchableOpacity
                onPress={() => {
                  onLeftIconPress();
                }}
                style={{ padding: 5 }}
              >
                <Image
                  source={leftIconName}
                  style={[
                    GlobalStyles.iconSize,
                    { tintColor: Colors.MilkWhite },
                  ]}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
        <View
          style={{
            flex: 6,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {heading && (
            <>
              <Text
                style={{
                  fontSize: DIM.deviceFont * 20,
                  fontWeight: "700",
                  color: Colors.MilkWhite,
                  fontStyle: "normal",
                }}
              >
                {heading}
              </Text>
            </>
          )}
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          {rightIconName && (
            <>
              <TouchableOpacity
                onPress={() => {
                  onRightIconPress();
                }}
                style={{ padding: 5 }}
              >
                <Image
                  source={rightIconName}
                  style={[
                    GlobalStyles.iconSize,
                    { tintColor: Colors.MilkWhite },
                  ]}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

export default CustomHeader;

// how to use CustomHeader
{
  /* <CustomHeader
  heading={"heading"}
  leftIconName={`Left icons name`}
  onLeftIconPress={`function of the left press`} // the left icon press should be a function
  headerBg={`bg color of the header`}
  onRightIconPress={`function of the right press`} // the right icon press should be a function
  rightIconName={`Right icons name`}
/>; */
}
