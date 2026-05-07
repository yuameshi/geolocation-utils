import Foundation
import UIKit
import React

@objc(ScreenControlModule)
class ScreenControlModule: NSObject {

  private var originalBrightness: CGFloat = -1

  @objc
  static func requiresMainQueueSetup() -> Bool {
    return false
  }

  @objc
  func lockLandscape(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
        appDelegate.orientationLock = .landscape
        // Force orientation change
        if #available(iOS 16.0, *) {
          guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            resolve(nil)
            return
          }
          windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: .landscape))
          // Trigger setNeedsUpdateOfSupportedInterfaceOrientations
          for window in windowScene.windows {
            window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
          }
        } else {
          UIDevice.current.setValue(UIInterfaceOrientation.landscapeRight.rawValue, forKey: "orientation")
          UIViewController.attemptRotationToDeviceOrientation()
        }
      }
      resolve(nil)
    }
  }

  @objc
  func unlockOrientation(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
        appDelegate.orientationLock = .all
        if #available(iOS 16.0, *) {
          guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene else {
            resolve(nil)
            return
          }
          windowScene.requestGeometryUpdate(.iOS(interfaceOrientations: .all))
          for window in windowScene.windows {
            window.rootViewController?.setNeedsUpdateOfSupportedInterfaceOrientations()
          }
        } else {
          UIDevice.current.setValue(UIInterfaceOrientation.portrait.rawValue, forKey: "orientation")
          UIViewController.attemptRotationToDeviceOrientation()
        }
      }
      resolve(nil)
    }
  }

  @objc
  func setMaxBrightness(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      self.originalBrightness = UIScreen.main.brightness
      UIScreen.main.brightness = 1.0
      resolve(nil)
    }
  }

  @objc
  func restoreBrightness(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      if self.originalBrightness >= 0 {
        UIScreen.main.brightness = self.originalBrightness
        self.originalBrightness = -1
      }
      resolve(nil)
    }
  }

  @objc
  func getScreenOrientation(_ resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async {
      var orientation = "unknown"
      if #available(iOS 16.0, *) {
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
          switch windowScene.interfaceOrientation {
          case .portrait:
            orientation = "portrait"
          case .portraitUpsideDown:
            orientation = "portrait-upside-down"
          case .landscapeLeft:
            orientation = "landscape-left"
          case .landscapeRight:
            orientation = "landscape-right"
          default:
            orientation = "unknown"
          }
        }
      } else {
        switch UIApplication.shared.statusBarOrientation {
        case .portrait:
          orientation = "portrait"
        case .portraitUpsideDown:
          orientation = "portrait-upside-down"
        case .landscapeLeft:
          orientation = "landscape-left"
        case .landscapeRight:
          orientation = "landscape-right"
        default:
          orientation = "unknown"
        }
      }
      resolve(orientation)
    }
  }
}
