import React, { useState } from "react";
import {
  Image,
  Animated,
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Colors, DIM, Icons } from "../../utilities/Constants";
import CustomHeader from "../../components/CustomHeader";
import { GlobalStyles } from "../../utilities/GlobalStyles";

const data = [
  "https://cdn.dribbble.com/users/3281732/screenshots/11192830/media/7690704fa8f0566d572a085637dd1eee.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/13130602/media/592ccac0a949b39f058a297fd1faa38e.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/9165292/media/ccbfbce040e1941972dbc6a378c35e98.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/11205211/media/44c854b0a6e381340fbefe276e03e8e4.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/7003560/media/48d5ac3503d204751a2890ba82cc42ad.jpg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/6727912/samji_illustrator.jpeg?compress=1&resize=1200x1200",
  "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
];

const MusicPlayer = ({ navigation }) => {
  const scrollX = React.useRef(new Animated.Value(0)).current;

  const [isLiked, setIsLiked] = useState(false);
  const [isDownload, setIsDownload] = useState(false);
  const [isPlayPause, setIsPlayPause] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ zIndex: 8 }}>
        <CustomHeader
          heading={"Now Playing Hero"}
          leftIconName={Icons.IconBack}
          onLeftIconPress={() => {
            navigation.goBack();
          }}
          rightIconName={Icons.IconShare}
        />
      </View>
      {/* {Background Image} */}
      <View style={[StyleSheet.absoluteFillObject]}>
        {data.map((image, index) => {
          const inputRange = [
            (index - 1) * DIM.deviceWidth,
            index * DIM.deviceWidth,
            (index + 1) * DIM.deviceWidth,
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
              blurRadius={30}
            />
          );
        })}
      </View>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        {/* {Playlist Image} */}
        <View style={{ height: DIM.deviceHeight * 0.7 }}>
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
                <View style={styles.flatListImageView}>
                  <Image source={{ uri: item }} style={styles.flatListImage} />
                </View>
              );
            }}
          />
        </View>
        <View
          style={{
            marginTop: -DIM.deviceHeight * 0.19,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={styles.trackNameView}>
              <Text style={styles.trackName}>Hero</Text>
              <Text style={styles.trackSubName}>Hero</Text>
            </View>
            <View
              style={{
                width: DIM.deviceWidth * 0.2,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  setIsDownload(!isDownload);
                }}
              >
                <Image
                  source={Icons.IconDownload}
                  style={{
                    width: DIM.deviceWidth * 0.07,
                    height: DIM.deviceHeight * 0.04,
                    resizeMode: "contain",
                    marginLeft: -DIM.deviceWidth * 0.04,
                    tintColor: isDownload ? "#3B9E62" : Colors.MilkWhite,
                  }}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setIsLiked(!isLiked);
                }}
              >
                <Image
                  source={isLiked ? Icons.IconFillHeart : Icons.IconEmptyHeart}
                  style={[
                    GlobalStyles.iconSize,
                    {
                      marginRight: DIM.deviceWidth * 0.04,
                      tintColor: isLiked ? null : Colors.MilkWhite,
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>
          {/* {Slider} */}
          <Slider
            style={styles.slider}
            value={10}
            minimumValue={0}
            maximumValue={100}
            thumbTintColor={Colors.MilkWhite}
            minimumTrackTintColor={Colors.MilkWhite}
            maximumTrackTintColor={Colors.TRANSPARENT}
            onSlidingComplete={() => {}}
          />
        </View>
        {/* {Timer} */}
      </View>
      <View style={styles.timerView}>
        <Text style={styles.timeLabel}>0:28</Text>
        <Text style={styles.timeLabel}>4:58</Text>
      </View>
      {/* {controls} */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: DIM.deviceHeight * 0.01,
        }}
      >
        <TouchableOpacity>
          <Image
            source={Icons.IconNext}
            style={{
              width: DIM.deviceWidth * 0.05,
              height: DIM.deviceHeight * 0.03,
              resizeMode: "contain",
              transform: [{ scaleX: -1 }],
              tintColor: Colors.MilkWhite,
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            setIsPlayPause(!isPlayPause);
          }}
        >
          <Image
            source={isPlayPause ? Icons.IconPause : Icons.IconPlay}
            style={{
              width: DIM.deviceWidth * 0.14,
              height: DIM.deviceHeight * 0.0715,
              marginLeft: DIM.deviceWidth * 0.08,
              marginRight: DIM.deviceWidth * 0.08,
              tintColor: Colors.MilkWhite,
              resizeMode: "contain",
            }}
          />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image
            source={Icons.IconNext}
            style={{
              width: DIM.deviceWidth * 0.05,
              height: DIM.deviceHeight * 0.03,
              resizeMode: "contain",
              tintColor: Colors.MilkWhite,
            }}
          />
        </TouchableOpacity>
      </View>
      {/* {link section} */}
      <View
        style={{
          marginLeft: DIM.deviceWidth * 0.14,
          marginTop: DIM.deviceHeight * 0.03,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Image
            source={Icons.IconSpotify}
            style={{
              width: DIM.deviceWidth * 0.08,
              height: DIM.deviceHeight * 0.05,
              resizeMode: "contain",
            }}
          />
          <Image
            source={Icons.IconYoutube}
            style={{
              width: DIM.deviceWidth * 0.08,
              height: DIM.deviceHeight * 0.05,
              marginLeft: DIM.deviceWidth * 0.03,
              resizeMode: "contain",
            }}
          />
        </View>
        <Text style={styles.linkText}>Hear the song from above platform</Text>
      </View>
    </SafeAreaView>
  );
};

export default MusicPlayer;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  flatListImageView: {
    width: DIM.deviceWidth,
    marginTop: DIM.deviceHeight * 0.03,
    alignItems: "center",
  },
  flatListImage: {
    width: DIM.deviceWidth * 0.8,
    height: DIM.deviceHeight * 0.45,
    resizeMode: "cover",
    borderRadius: 16,
  },
  slider: {
    width: DIM.deviceWidth * 0.8,
    marginBottom: DIM.deviceHeight * 0.015,
    flexDirection: "row",
  },
  timerView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: DIM.deviceWidth * 0.14,
    marginTop: -DIM.deviceHeight * 0.005,
  },
  timeLabel: {
    fontSize: DIM.deviceFont * 11,
    fontWeight: "700",
    color: Colors.MilkWhite,
  },
  trackNameView: {
    marginBottom: DIM.deviceHeight * 0.012,
    marginLeft: DIM.deviceWidth * 0.04,
    width: DIM.deviceWidth * 0.51,
  },
  trackName: {
    fontSize: DIM.deviceFont * 18,
    fontWeight: "700",
    color: Colors.MilkWhite,
    letterSpacing: 1,
  },
  trackSubName: {
    fontSize: DIM.deviceFont * 14,
    color: Colors.MilkWhite,
    letterSpacing: 1,
  },
  linkText: {
    fontSize: DIM.deviceFont * 14,
    fontWeight: "400",
    color: Colors.MilkWhite,
    marginTop: DIM.deviceHeight * 0.012,
    textAlign: "center",
    marginLeft: -DIM.deviceWidth * 0.14,
  },
});
