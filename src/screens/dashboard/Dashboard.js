import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { GlobalStyles } from "../../utilities/GlobalStyles";
import { DIM } from "../../utilities/Constants";
import Slider from "@react-native-community/slider";

const Dashboard = () => {
  return (
    <SafeAreaView>
      <View style={GlobalStyles.marginView}>
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            marginTop: DIM.deviceHeight * 0.1,
          }}
        >
          <Image
            source={{
              uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
            }}
            style={{
              height: DIM.deviceHeight * 0.55,
              width: DIM.deviceWidth * 0.8,
              borderRadius: 16,
            }}
          />
        </View>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          <Slider
            style={{
              width: DIM.deviceWidth * 0.8,
              marginTop: DIM.deviceHeight * 0.015,
              marginBottom: DIM.deviceHeight * 0.015,
              flexDirection: "row",
            }}
            value={10}
            minimumValue={0}
            maximumValue={100}
            thumbTintColor="#FFD369"
            minimumTrackTintColor="#FFD369"
            maximumTrackTintColor="#fff"
            onSlidingComplete={() => {}}
          />
          {/* {Progress duration} */}
          <View
            style={{
              width: DIM.deviceWidth * 0.8,
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <Text>00:00</Text>
            <Text>00:00</Text>
          </View>
        </View>
        <View
          style={{
            alignItems: "center",
            justifyContent: "space-evenly",
            flexDirection: "row",
            marginTop: 20,
          }}
        >
          <Image
            source={{
              uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
            }}
            style={GlobalStyles.iconSize}
          />
          <Image
            source={{
              uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
            }}
            style={GlobalStyles.iconSize}
          />
          <Image
            source={{
              uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
            }}
            style={GlobalStyles.iconSize}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({});
