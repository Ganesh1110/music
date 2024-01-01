// import React from "react";
// import { Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
// import { GlobalStyles } from "../../utilities/GlobalStyles";
//
// import Slider from "@react-native-community/slider";

// const Dashboard = () => {
//   return (
//     <SafeAreaView>
//       <View style={GlobalStyles.marginView}>
//         <View
//           style={{
//             alignItems: "center",
//             justifyContent: "center",
//             marginTop: DIM.deviceHeight * 0.1,
//           }}
//         >
//           <Image
//             source={{
//               uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
//             }}
//             style={{
//               height: DIM.deviceHeight * 0.55,
//               width: DIM.deviceWidth * 0.8,
//               borderRadius: 16,
//             }}
//           />
//         </View>
//         {/* <View style={{ alignItems: "center", justifyContent: "center" }}>
//           <Slider
//             style={{
//               width: DIM.deviceWidth * 0.8,
//               marginTop: DIM.deviceHeight * 0.015,
//               marginBottom: DIM.deviceHeight * 0.015,
//               flexDirection: "row",
//             }}
//             value={10}
//             minimumValue={0}
//             maximumValue={100}
//             thumbTintColor="#FFD369"
//             minimumTrackTintColor="#FFD369"
//             maximumTrackTintColor="#fff"
//             onSlidingComplete={() => {}}
//           />
//           <View
//             style={{
//               width: DIM.deviceWidth * 0.8,
//               flexDirection: "row",
//               justifyContent: "space-between",
//             }}
//           >
//             <Text>00:00</Text>
//             <Text>00:00</Text>
//           </View>
//         </View> */}
//         {/* <View
//           style={{
//             alignItems: "center",
//             justifyContent: "space-evenly",
//             flexDirection: "row",
//             marginTop: 20,
//           }}
//         >
//           <Image
//             source={{
//               uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
//             }}
//             style={GlobalStyles.iconSize}
//           />
//           <Image
//             source={{
//               uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
//             }}
//             style={GlobalStyles.iconSize}
//           />
//           <Image
//             source={{
//               uri: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
//             }}
//             style={GlobalStyles.iconSize}
//           />
//         </View> */}
//       </View>
//     </SafeAreaView>
//   );
// };

// export default Dashboard;

// const styles = StyleSheet.create({});

import React from "react";
import { Image, Animated, View, Dimensions, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { DIM } from "../../utilities/Constants";
const { width, height } = Dimensions.get("screen");

const data = [
  "https://cdn.dribbble.com/users/3281732/screenshots/11192830/media/7690704fa8f0566d572a085637dd1eee.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/13130602/media/592ccac0a949b39f058a297fd1faa38e.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/9165292/media/ccbfbce040e1941972dbc6a378c35e98.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/11205211/media/44c854b0a6e381340fbefe276e03e8e4.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/7003560/media/48d5ac3503d204751a2890ba82cc42ad.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/6727912/samji_illustrator.jpeg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
];

const imageW = width * 0.7;
const imageH = imageW * 1.54;

const Dashboard = () => {
  const scrollX = React.useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={[StyleSheet.absoluteFillObject]}>
        {data.map((image, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0, 1, 0],
          });
          return (
            <Animated.Image
              key={`image-${index}`}
              source={{ uri: image }}
              style={[
                StyleSheet.absoluteFillObject,
                {
                  opacity,
                },
              ]}
              blurRadius={10}
            />
          );
        })}
      </View>
      <Animated.FlatList
        data={data}
        horizontal
        pagingEnabled
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => {
          return (
            <View
              style={{
                width,
                marginTop: DIM.deviceHeight * 0.1,
                alignItems: "center",
                shadowColor: "#000",
                elevation: 4,
                shadowOffset: {
                  width: 0,
                  height: 9,
                },
                shadowOpacity: 0.8,
              }}
            >
              <Image
                source={{ uri: item }}
                style={{
                  width: imageW,
                  height: imageH,
                  resizeMode: "cover",
                  borderRadius: 16,
                }}
              />
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
                onSlidingComplete={() => {
                  console.warn("hi");
                }}
              />
            </View>
          );
        }}
      />
    </View>
  );
};

export default Dashboard;
