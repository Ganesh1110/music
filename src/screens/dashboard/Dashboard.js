import React from "react";
import {
  Image,
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import FastImage from "react-native-fast-image";
import { FlashList } from "@shopify/flash-list";
import { Colors, DIM, Icons } from "../../utilities/Constants";
import { GlobalStyles } from "../../utilities/GlobalStyles";

const Dashboard = ({ navigation }) => {
  const ListData = [
    {
      id: 1,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/11192830/media/7690704fa8f0566d572a085637dd1eee.jpg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
    {
      id: 2,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/13130602/media/592ccac0a949b39f058a297fd1faa38e.jpg?compress=1&resize=1200x1200",
      duration: "5:28",
    },
    {
      id: 3,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/9165292/media/ccbfbce040e1941972dbc6a378c35e98.jpg?compress=1&resize=1200x1200",
      duration: "2:20",
    },
    {
      id: 4,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/11205211/media/44c854b0a6e381340fbefe276e03e8e4.jpg?compress=1&resize=1200x1200",
      duration: "6:38",
    },
    {
      id: 5,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/7003560/media/48d5ac3503d204751a2890ba82cc42ad.jpg?compress=1&resize=1200x1200",
      duration: "5:50",
    },
    {
      id: 6,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/6727912/samji_illustrator.jpeg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
    {
      id: 7,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
    {
      id: 8,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
    {
      id: 9,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
    {
      id: 10,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
    {
      id: 11,
      trackName: "Super Hero",
      artist: "Zeus",
      logo: "https://cdn.dribbble.com/users/3281732/screenshots/13661330/media/1d9d3cd01504fa3f5ae5016e5ec3a313.jpg?compress=1&resize=1200x1200",
      duration: "4:28",
    },
  ];

  const RenderUI = ({ data }) => {
    return (
      <TouchableOpacity
        style={[styles.listView]}
        onPress={() => {
          navigationFunction(data);
        }}
      >
        <View style={styles.listInnerView}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <FastImage style={styles.listImage} source={{ uri: data.logo }} />
            <View style={{ marginLeft: DIM.deviceWidth * 0.012 }}>
              <Text style={styles.trackName}>{data.trackName}</Text>
              <Text style={styles.trackSubName}>{data.artist}</Text>
              <Text style={styles.trackTime}>{data.duration}</Text>
            </View>
          </View>
          <TouchableOpacity>
            <Image
              source={Icons.IconMore}
              style={[
                GlobalStyles.iconSize,
                {
                  tintColor: Colors.MilkWhite,
                  marginRight: DIM.deviceWidth * 0.03,
                },
              ]}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const navigationFunction = (data) => {
    if (data) {
      navigation.navigate("MusicPlayer", { data: data });
    }
  };

  const ListHeader = () => {
    return (
      <>
        <View style={GlobalStyles.marginView}>
          <View style={styles.profileView}>
            <Text style={styles.ProName}>Name</Text>
            <Image source={Icons.IconSpotify} style={styles.profileIcon} />
          </View>
        </View>
        <View style={styles.splitLine} />
      </>
    );
  };

  return (
    <>
      <ImageBackground
        source={{
          uri: "https://cdn.dribbble.com/users/3281732/screenshots/11205211/media/44c854b0a6e381340fbefe276e03e8e4.jpg?compress=1&resize=1200x1200",
        }}
        blurRadius={10}
        style={{ backgroundColor: Colors.TRANSPARENT }}
      >
        <View style={{ height: DIM.deviceHeight, width: DIM.deviceWidth }}>
          <View style={GlobalStyles.marginView}>
            <View style={styles.profileView}>
              <Text style={styles.ProName}>Name</Text>
              <Image source={Icons.IconSpotify} style={styles.profileIcon} />
            </View>
          </View>
          <View style={styles.splitLine} />
          <>
            <FlashList
              data={ListData}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => <RenderUI data={item} />}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{
                paddingBottom: DIM.deviceHeight * 0.012,
              }}
              estimatedItemSize={100}
            />
          </>
        </View>
      </ImageBackground>
    </>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  ProName: {
    color: Colors.MilkWhite,
    fontWeight: "600",
    fontSize: DIM.deviceFont * 16,
  },
  profileView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: DIM.deviceHeight * 0.012,
    marginBottom: DIM.deviceHeight * 0.012,
    marginHorizontal: DIM.deviceWidth * 0.01,
  },
  profileIcon: {
    width: DIM.deviceWidth * 0.135,
    height: DIM.deviceHeight * 0.062,
    resizeMode: "contain",
  },
  splitLine: {
    borderBottomWidth: 1,
    borderBlockColor: Colors.TRANSPARENT,
    width: DIM.deviceWidth * 2,
  },
  listView: {
    marginLeft: DIM.deviceWidth * 0.02,
    marginRight: DIM.deviceWidth * 0.02,
    marginTop: DIM.deviceHeight * 0.008,
    borderColor: Colors.TRANSPARENT,
    borderWidth: 1,
    borderRadius: 10,
  },
  listInnerView: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.TRANSPARENT,
    padding: 6,
    borderRadius: 10,
  },
  listImage: {
    width: DIM.deviceWidth * 0.12,
    height: DIM.deviceHeight * 0.06,
    borderRadius: 10,
    marginLeft: DIM.deviceWidth * 0.008,
  },
  trackName: {
    fontSize: DIM.deviceFont * 16,
    fontWeight: "800",
    color: Colors.MilkWhite,
  },
  trackSubName: {
    fontSize: DIM.deviceFont * 12,
    color: Colors.MilkWhite,
    fontWeight: "500",
  },
  trackTime: {
    fontSize: DIM.deviceFont * 12,
    color: Colors.MilkWhite,
    fontWeight: "300",
  },
  listSplit: {
    borderBottomWidth: 1,
    borderBlockColor: Colors.Mist,
    width: DIM.deviceWidth * 2,
  },
});
